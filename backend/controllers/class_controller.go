package controllers

import (
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"
)

// GetClasses lists classes with pagination and search
func GetClasses(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit
	search := "%" + c.QueryParam("search") + "%"
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)

	teacherID := ""
	if claims != nil && claims.Role == "guru" {
		if err := database.DB.QueryRow("SELECT id FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherID); err != nil {
			return c.JSON(http.StatusOK, map[string]interface{}{
				"data": []models.Class{},
				"meta": PaginationMeta{
					TotalItems:  0,
					TotalPages:  1,
					CurrentPage: page,
					Limit:       limit,
				},
			})
		}
	}

	var totalItems int
	countQuery := `
		SELECT COUNT(*) FROM classes c
		WHERE c.name ILIKE $1
	`
	countArgs := []interface{}{search}
	if teacherID != "" {
		countQuery += " AND c.homeroom_teacher_id = $2"
		countArgs = append(countArgs, teacherID)
	}
	err := database.DB.QueryRow(countQuery, countArgs...).Scan(&totalItems)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to count classes"})
	}

	query := `
		SELECT 
			c.id, c.name, c.grade_level, c.academic_year, 
			COALESCE(c.homeroom_teacher_id::VARCHAR, ''),
			COALESCE(t.full_name, '') as homeroom_teacher_name,
			(SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = true) as student_count,
			CAST(c.created_at AS VARCHAR), CAST(c.updated_at AS VARCHAR)
		FROM classes c
		LEFT JOIN teachers t ON t.id = c.homeroom_teacher_id
		WHERE c.name ILIKE $1
	ORDER BY c.grade_level ASC, c.name ASC
		LIMIT $2 OFFSET $3
	`
	args := []interface{}{search, limit, offset}
	if teacherID != "" {
		query = `
		SELECT 
			c.id, c.name, c.grade_level, c.academic_year, 
			COALESCE(c.homeroom_teacher_id::VARCHAR, ''),
			COALESCE(t.full_name, '') as homeroom_teacher_name,
			(SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = true) as student_count,
			CAST(c.created_at AS VARCHAR), CAST(c.updated_at AS VARCHAR)
		FROM classes c
		LEFT JOIN teachers t ON t.id = c.homeroom_teacher_id
		WHERE c.name ILIKE $1 AND c.homeroom_teacher_id = $2
		ORDER BY c.grade_level ASC, c.name ASC
		LIMIT $3 OFFSET $4
	`
		args = []interface{}{search, teacherID, limit, offset}
	}
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch classes: " + err.Error()})
	}
	defer rows.Close()

	classes := []models.Class{}
	for rows.Next() {
		var cl models.Class
		if err := rows.Scan(
			&cl.ID, &cl.Name, &cl.GradeLevel, &cl.AcademicYear,
			&cl.HomeroomTeacherID, &cl.HomeroomTeacherName, &cl.StudentCount,
			&cl.CreatedAt, &cl.UpdatedAt,
		); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to parse class data"})
		}
		classes = append(classes, cl)
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": classes,
		"meta": PaginationMeta{
			TotalItems:  totalItems,
			TotalPages:  totalPages,
			CurrentPage: page,
			Limit:       limit,
		},
	})
}

// GetClassByID fetches a specific class by ID
func GetClassByID(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)

	teacherID := ""
	if claims != nil && claims.Role == "guru" {
		if err := database.DB.QueryRow("SELECT id FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherID); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "Class not found"})
		}
	}
	query := `
		SELECT 
			c.id, c.name, c.grade_level, c.academic_year, 
			COALESCE(c.homeroom_teacher_id::VARCHAR, ''),
			COALESCE(t.full_name, '') as homeroom_teacher_name,
			(SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = true) as student_count,
			CAST(c.created_at AS VARCHAR), CAST(c.updated_at AS VARCHAR)
		FROM classes c
		LEFT JOIN teachers t ON t.id = c.homeroom_teacher_id
		WHERE c.id = $1
	`
	args := []interface{}{id}
	if teacherID != "" {
		query += " AND c.homeroom_teacher_id = $2"
		args = append(args, teacherID)
	}
	var cl models.Class
	err := database.DB.QueryRow(query, args...).Scan(
		&cl.ID, &cl.Name, &cl.GradeLevel, &cl.AcademicYear,
		&cl.HomeroomTeacherID, &cl.HomeroomTeacherName, &cl.StudentCount,
		&cl.CreatedAt, &cl.UpdatedAt,
	)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Class not found"})
	}
	return c.JSON(http.StatusOK, cl)
}

// CreateClass creates a new class
func CreateClass(c echo.Context) error {
	req := new(models.CreateClassRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.Name == "" || req.GradeLevel == 0 || req.AcademicYear == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Nama kelas, tingkat kelas, dan tahun ajaran wajib diisi"})
	}

	var homeroomTeacherID interface{}
	if req.HomeroomTeacherID != "" {
		homeroomTeacherID = req.HomeroomTeacherID
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO classes (name, grade_level, academic_year, homeroom_teacher_id)
		VALUES ($1, $2, $3, $4) RETURNING id
	`, req.Name, req.GradeLevel, req.AcademicYear, homeroomTeacherID).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan kelas: " + err.Error()})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Kelas berhasil ditambahkan", "id": id})
}

// UpdateClass updates an existing class
func UpdateClass(c echo.Context) error {
	id := c.Param("id")
	req := new(models.CreateClassRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	var homeroomTeacherID interface{}
	if req.HomeroomTeacherID != "" {
		homeroomTeacherID = req.HomeroomTeacherID
	}

	_, err := database.DB.Exec(`
		UPDATE classes SET
			name = $1,
			grade_level = $2,
			academic_year = $3,
			homeroom_teacher_id = $4,
			updated_at = NOW()
		WHERE id = $5
	`, req.Name, req.GradeLevel, req.AcademicYear, homeroomTeacherID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui data kelas: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Data kelas berhasil diperbarui"})
}

// DeleteClass removes a class
func DeleteClass(c echo.Context) error {
	id := c.Param("id")
	
	// Set class_id to null for all students in this class before deleting
	database.DB.Exec("UPDATE students SET class_id = NULL WHERE class_id = $1", id)

	_, err := database.DB.Exec("DELETE FROM classes WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus kelas"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Kelas berhasil dihapus"})
}

// GetClassStudents fetches all active students in a class
func GetClassStudents(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims != nil && claims.Role == "guru" {
		var allowed bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1
				FROM classes c
				JOIN teachers t ON t.id = c.homeroom_teacher_id
				WHERE c.id = $1 AND t.nip = $2
			)
		`, id, claims.Identifier).Scan(&allowed)
		if err != nil || !allowed {
			return c.JSON(http.StatusForbidden, map[string]string{"message": "Anda tidak memiliki akses ke kelas ini"})
		}
	}

	rows, err := database.DB.Query(`
		SELECT id, nis, full_name, gender 
		FROM students 
		WHERE class_id = $1 AND is_active = true 
		ORDER BY full_name ASC
	`, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data siswa kelas ini"})
	}
	defer rows.Close()

	type StudentInfo struct {
		ID       string `json:"id"`
		NIS      string `json:"nis"`
		FullName string `json:"full_name"`
		Gender   string `json:"gender"`
	}

	var students []StudentInfo
	for rows.Next() {
		var s StudentInfo
		rows.Scan(&s.ID, &s.NIS, &s.FullName, &s.Gender)
		students = append(students, s)
	}
	return c.JSON(http.StatusOK, students)
}

// AssignStudentsToClass assigns an array of students to the class
func AssignStudentsToClass(c echo.Context) error {
	id := c.Param("id")
	req := new(models.AssignStudentsRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	if len(req.StudentIDs) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Tidak ada siswa yang dipilih"})
	}

	// Create a parameterized query for bulk update
	placeholders := []string{}
	args := []interface{}{id} // arg $1 is class_id
	
	for i, studentID := range req.StudentIDs {
		placeholders = append(placeholders, "$"+strconv.Itoa(i+2))
		args = append(args, studentID)
	}

	query := "UPDATE students SET class_id = $1 WHERE id IN (" + strings.Join(placeholders, ",") + ")"
	
	_, err := database.DB.Exec(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memasukkan siswa ke kelas: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Siswa berhasil dimasukkan ke kelas"})
}

// RemoveStudentFromClass removes a single student from the class
func RemoveStudentFromClass(c echo.Context) error {
	studentID := c.Param("student_id")
	_, err := database.DB.Exec("UPDATE students SET class_id = NULL WHERE id = $1", studentID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengeluarkan siswa dari kelas: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Siswa berhasil dikeluarkan dari kelas"})
}
