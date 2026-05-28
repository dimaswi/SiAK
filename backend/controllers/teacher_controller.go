package controllers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"siak/backend/database"
	"siak/backend/models"
)

const teacherSelectFields = `
	SELECT
		t.id, t.user_id,
		t.nip, COALESCE(t.nuptk,''), t.full_name, t.gender,
		COALESCE(t.birth_place,''), COALESCE(CAST(t.birth_date AS VARCHAR),''),
		COALESCE(t.religion,''), COALESCE(t.nationality,''),
		COALESCE(t.marital_status::VARCHAR,''),
		COALESCE(t.nik,''), COALESCE(t.npwp,''),
		COALESCE(t.employee_status::VARCHAR,''), COALESCE(t.position,''),
		COALESCE(t.subject,''), COALESCE(t.teaching_hours,0), COALESCE(t.rank,''),
		COALESCE(t.sk_number,''), COALESCE(CAST(t.join_date AS VARCHAR),''),
		COALESCE(t.education_level::VARCHAR,''), COALESCE(t.education_major,''),
		COALESCE(t.university,''), COALESCE(t.graduation_year,0),
		COALESCE(t.cert_number,''),
		COALESCE(t.phone,''), COALESCE(t.email,''),
		COALESCE(t.address,''), COALESCE(t.rt_rw,''), COALESCE(t.village,''),
		COALESCE(t.district,''), COALESCE(t.city,''), COALESCE(t.province,''),
		COALESCE(t.postal_code,''),
		COALESCE(t.photo_url,''), t.is_active
	FROM teachers t
`

func scanTeacher(row interface{ Scan(...interface{}) error }) (models.Teacher, error) {
	var t models.Teacher
	err := row.Scan(
		&t.ID, &t.UserID,
		&t.NIP, &t.NUPTK, &t.FullName, &t.Gender,
		&t.BirthPlace, &t.BirthDate,
		&t.Religion, &t.Nationality,
		&t.MaritalStatus,
		&t.NIK, &t.NPWP,
		&t.EmployeeStatus, &t.Position,
		&t.Subject, &t.TeachingHours, &t.Rank,
		&t.SKNumber, &t.JoinDate,
		&t.EducationLevel, &t.EducationMajor,
		&t.University, &t.GraduationYear,
		&t.CertNumber,
		&t.Phone, &t.Email,
		&t.Address, &t.RtRw, &t.Village,
		&t.District, &t.City, &t.Province,
		&t.PostalCode,
		&t.PhotoURL, &t.IsActive,
	)
	return t, err
}

// GetTeachers lists teachers with pagination and optional search
func GetTeachers(c echo.Context) error {
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

	var totalItems int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM teachers t
		WHERE t.full_name ILIKE $1 OR t.nip ILIKE $1 OR COALESCE(t.nuptk,'') ILIKE $1
	`, search).Scan(&totalItems)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to count teachers"})
	}

	query := teacherSelectFields + `
		WHERE t.full_name ILIKE $1 OR t.nip ILIKE $1 OR COALESCE(t.nuptk,'') ILIKE $1
		ORDER BY t.full_name ASC
		LIMIT $2 OFFSET $3
	`
	rows, err := database.DB.Query(query, search, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch teachers"})
	}
	defer rows.Close()

	teachers := []models.Teacher{}
	for rows.Next() {
		t, err := scanTeacher(rows)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to parse teacher data"})
		}
		teachers = append(teachers, t)
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": teachers,
		"meta": PaginationMeta{
			TotalItems:  totalItems,
			TotalPages:  totalPages,
			CurrentPage: page,
			Limit:       limit,
		},
	})
}

// GetTeacherByID fetches a specific teacher by ID
func GetTeacherByID(c echo.Context) error {
	id := c.Param("id")
	row := database.DB.QueryRow(teacherSelectFields+"WHERE t.id = $1", id)
	t, err := scanTeacher(row)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Guru tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, t)
}

// CreateTeacher creates a new user and teacher profile
func CreateTeacher(c echo.Context) error {
	req := new(models.CreateTeacherRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.NIP == "" || req.FullName == "" || req.Password == "" || req.Gender == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "NIP, Nama Lengkap, Jenis Kelamin, dan Password wajib diisi"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to process password"})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction error"})
	}
	defer tx.Rollback()

	var userID string
	err = tx.QueryRow(`
		INSERT INTO users (identifier, password_hash, role, is_active, must_change_password)
		VALUES ($1, $2, 'guru', true, true) RETURNING id
	`, req.NIP, string(hashedPassword)).Scan(&userID)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"message": "Guru dengan NIP ini sudah terdaftar"})
	}

	_, err = tx.Exec(`
		INSERT INTO teachers (
			user_id, nip, nuptk, full_name, gender,
			birth_place, birth_date, religion, nationality, marital_status,
			nik, npwp,
			employee_status, position, subject, teaching_hours, rank, sk_number, join_date,
			education_level, education_major, university, graduation_year, cert_number,
			phone, email,
			address, rt_rw, village, district, city, province, postal_code
		) VALUES (
			$1,$2,NULLIF($3,''),$4,$5,
			$6,NULLIF($7,'')::DATE,$8,$9,NULLIF($10,'')::marital_status,
			NULLIF($11,''),NULLIF($12,''),
			NULLIF($13,'')::employee_status,$14,$15,NULLIF($16,0),$17,$18,NULLIF($19,'')::DATE,
			NULLIF($20,'')::education_level,$21,$22,NULLIF($23,0),$24,
			$25,$26,
			$27,$28,$29,$30,$31,$32,$33
		)
	`, userID, req.NIP, req.NUPTK, req.FullName, req.Gender,
		req.BirthPlace, req.BirthDate, req.Religion, req.Nationality, req.MaritalStatus,
		req.NIK, req.NPWP,
		req.EmployeeStatus, req.Position, req.Subject, req.TeachingHours, req.Rank, req.SKNumber, req.JoinDate,
		req.EducationLevel, req.EducationMajor, req.University, req.GraduationYear, req.CertNumber,
		req.Phone, req.Email,
		req.Address, req.RtRw, req.Village, req.District, req.City, req.Province, req.PostalCode)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan profil guru: " + err.Error()})
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction commit failed"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Guru berhasil ditambahkan"})
}

// UpdateTeacher updates an existing teacher profile
func UpdateTeacher(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdateTeacherRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	_, err := database.DB.Exec(`
		UPDATE teachers SET
			nip=$1, nuptk=NULLIF($2,''), full_name=$3, gender=$4,
			birth_place=$5, birth_date=NULLIF($6,'')::DATE,
			religion=$7, nationality=$8, marital_status=NULLIF($9,'')::marital_status,
			nik=NULLIF($10,''), npwp=NULLIF($11,''),
			employee_status=NULLIF($12,'')::employee_status, position=$13,
			subject=$14, teaching_hours=NULLIF($15,0), rank=$16,
			sk_number=$17, join_date=NULLIF($18,'')::DATE,
			education_level=NULLIF($19,'')::education_level,
			education_major=$20, university=$21,
			graduation_year=NULLIF($22,0), cert_number=$23,
			phone=$24, email=$25,
			address=$26, rt_rw=$27, village=$28, district=$29,
			city=$30, province=$31, postal_code=$32,
			updated_at=NOW()
		WHERE id=$33
	`,
		req.NIP, req.NUPTK, req.FullName, req.Gender,
		req.BirthPlace, req.BirthDate,
		req.Religion, req.Nationality, req.MaritalStatus,
		req.NIK, req.NPWP,
		req.EmployeeStatus, req.Position,
		req.Subject, req.TeachingHours, req.Rank,
		req.SKNumber, req.JoinDate,
		req.EducationLevel,
		req.EducationMajor, req.University,
		req.GraduationYear, req.CertNumber,
		req.Phone, req.Email,
		req.Address, req.RtRw, req.Village, req.District,
		req.City, req.Province, req.PostalCode,
		id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui data guru: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Data guru berhasil diperbarui"})
}

// DeleteTeacher removes a teacher and their user account
func DeleteTeacher(c echo.Context) error {
	id := c.Param("id")
	var userID string
	err := database.DB.QueryRow("SELECT user_id FROM teachers WHERE id = $1", id).Scan(&userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Guru tidak ditemukan"})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction error"})
	}
	defer tx.Rollback()

	if _, err = tx.Exec("DELETE FROM teachers WHERE id = $1", id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus data guru"})
	}
	if _, err = tx.Exec("DELETE FROM users WHERE id = $1", userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus akun guru"})
	}
	tx.Commit()
	return c.JSON(http.StatusOK, map[string]string{"message": "Data guru berhasil dihapus"})
}
