package controllers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"
)

// PaginationMeta struct for paginated responses
type PaginationMeta struct {
	TotalItems  int `json:"total_items"`
	TotalPages  int `json:"total_pages"`
	CurrentPage int `json:"current_page"`
	Limit       int `json:"limit"`
}

// helper: COALESCE NULL int ke 0
func coalesceInt(v interface{}) int {
	if v == nil {
		return 0
	}
	if i, ok := v.(int64); ok {
		return int(i)
	}
	return 0
}

const studentSelectFields = `
	SELECT
		s.id, s.user_id,
		s.nis, COALESCE(s.nisn,''), s.full_name, s.gender,
		COALESCE(CAST(s.birth_date AS VARCHAR),''), COALESCE(s.birth_place,''),
		COALESCE(s.religion,''), COALESCE(s.nationality,''),
		COALESCE(s.birth_certificate_no,''), COALESCE(s.kk_number,''),
		COALESCE(s.pip_number,''), COALESCE(s.pip_reason,''),
		COALESCE(s.child_order,0), COALESCE(s.num_siblings,0),
		COALESCE(s.living_with,''), COALESCE(s.transportation,''),
		COALESCE(s.special_needs,''),
		COALESCE(s.address,''), COALESCE(s.rt_rw,''), COALESCE(s.village,''),
		COALESCE(s.district,''), COALESCE(s.city,''), COALESCE(s.province,''),
		COALESCE(s.postal_code,''), COALESCE(s.phone,''),
		COALESCE(s.class_id::VARCHAR,''),
		COALESCE(s.father_name,''), COALESCE(s.father_nik,''),
		COALESCE(s.father_birth_year,0), COALESCE(s.father_education::VARCHAR,''),
		COALESCE(s.father_occupation,''), COALESCE(s.father_income,0),
		COALESCE(s.father_is_alive, true),
		COALESCE(s.mother_name,''), COALESCE(s.mother_nik,''),
		COALESCE(s.mother_birth_year,0), COALESCE(s.mother_education::VARCHAR,''),
		COALESCE(s.mother_occupation,''), COALESCE(s.mother_income,0),
		COALESCE(s.mother_is_alive, true),
		COALESCE(s.parent_name,''), COALESCE(s.parent_phone,''),
		COALESCE(s.guardian_name,''), COALESCE(s.guardian_nik,''),
		COALESCE(s.guardian_phone,''), COALESCE(s.guardian_occupation,''),
		COALESCE(s.guardian_relation,''),
		COALESCE(CAST(s.enrollment_date AS VARCHAR),''),
		COALESCE(s.exit_type::VARCHAR,''), COALESCE(CAST(s.exit_date AS VARCHAR),''),
		COALESCE(s.exit_reason,''),
		COALESCE(s.photo_url,''), s.is_active
	FROM students s
`

func scanStudent(row interface{ Scan(...interface{}) error }) (models.Student, error) {
	var s models.Student
	err := row.Scan(
		&s.ID, &s.UserID,
		&s.NIS, &s.NISN, &s.FullName, &s.Gender,
		&s.BirthDate, &s.BirthPlace,
		&s.Religion, &s.Nationality,
		&s.BirthCertificateNo, &s.KKNumber,
		&s.PIPNumber, &s.PIPReason,
		&s.ChildOrder, &s.NumSiblings,
		&s.LivingWith, &s.Transportation,
		&s.SpecialNeeds,
		&s.Address, &s.RtRw, &s.Village,
		&s.District, &s.City, &s.Province,
		&s.PostalCode, &s.Phone,
		&s.ClassID,
		&s.FatherName, &s.FatherNIK,
		&s.FatherBirthYear, &s.FatherEducation,
		&s.FatherOccupation, &s.FatherIncome,
		&s.FatherIsAlive,
		&s.MotherName, &s.MotherNIK,
		&s.MotherBirthYear, &s.MotherEducation,
		&s.MotherOccupation, &s.MotherIncome,
		&s.MotherIsAlive,
		&s.ParentName, &s.ParentPhone,
		&s.GuardianName, &s.GuardianNIK,
		&s.GuardianPhone, &s.GuardianOccupation,
		&s.GuardianRelation,
		&s.EnrollmentDate,
		&s.ExitType, &s.ExitDate, &s.ExitReason,
		&s.PhotoURL, &s.IsActive,
	)
	return s, err
}

// GetStudents lists students with pagination and optional search
func GetStudents(c echo.Context) error {
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
		SELECT COUNT(*) FROM students s
		WHERE s.full_name ILIKE $1 OR s.nis ILIKE $1 OR COALESCE(s.nisn,'') ILIKE $1
	`, search).Scan(&totalItems)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to count students"})
	}

	query := studentSelectFields + `
		WHERE s.full_name ILIKE $1 OR s.nis ILIKE $1 OR COALESCE(s.nisn,'') ILIKE $1
		ORDER BY s.full_name ASC
		LIMIT $2 OFFSET $3
	`
	rows, err := database.DB.Query(query, search, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch students"})
	}
	defer rows.Close()

	students := []models.Student{}
	for rows.Next() {
		s, err := scanStudent(rows)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to parse student data"})
		}
		students = append(students, s)
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": students,
		"meta": PaginationMeta{
			TotalItems:  totalItems,
			TotalPages:  totalPages,
			CurrentPage: page,
			Limit:       limit,
		},
	})
}

// GetStudentByID fetches a specific student by ID
func GetStudentByID(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims != nil && claims.Role == "guru" {
		var allowed bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1
				FROM students s
				JOIN classes c ON c.id = s.class_id
				JOIN teachers t ON t.id = c.homeroom_teacher_id
				WHERE s.id = $1 AND t.nip = $2
			)
		`, id, claims.Identifier).Scan(&allowed)
		if err != nil || !allowed {
			return c.JSON(http.StatusForbidden, map[string]string{"message": "Anda tidak memiliki akses ke data siswa ini"})
		}
	}

	row := database.DB.QueryRow(studentSelectFields+"WHERE s.id = $1", id)
	s, err := scanStudent(row)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Student not found"})
	}
	return c.JSON(http.StatusOK, s)
}

// CreateStudent creates a new user and student profile
func CreateStudent(c echo.Context) error {
	req := new(models.CreateStudentRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.NIS == "" || req.FullName == "" || req.Password == "" || req.Gender == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "NIS, Nama Lengkap, Jenis Kelamin, dan Password wajib diisi"})
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
		VALUES ($1, $2, 'siswa', true, true) RETURNING id
	`, req.NIS, string(hashedPassword)).Scan(&userID)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"message": "Siswa dengan NIS ini sudah terdaftar"})
	}

	_, err = tx.Exec(`
		INSERT INTO students (
			user_id, nis, nisn, full_name, gender,
			birth_date, birth_place, religion, nationality,
			birth_certificate_no, kk_number,
			pip_number, pip_reason,
			child_order, num_siblings, living_with, transportation, special_needs,
			address, rt_rw, village, district, city, province, postal_code, phone,
			father_name, father_nik, father_birth_year, father_education, father_occupation, father_income, father_is_alive,
			mother_name, mother_nik, mother_birth_year, mother_education, mother_occupation, mother_income, mother_is_alive,
			parent_name, parent_phone,
			guardian_name, guardian_nik, guardian_phone, guardian_occupation, guardian_relation,
			enrollment_date
		) VALUES (
			$1,$2,$3,$4,$5,
			NULLIF($6,'')::DATE,$7,$8,$9,
			$10,$11,
			$12,$13,
			$14,$15,$16,$17,$18,
			$19,$20,$21,$22,$23,$24,$25,$26,
			$27,$28,NULLIF($29,0),$30,$31,NULLIF($32,0),$33,
			$34,$35,NULLIF($36,0),$37,$38,NULLIF($39,0),$40,
			$41,$42,
			$43,$44,$45,$46,$47,
			NULLIF($48,'')::DATE
		)
	`, userID, req.NIS, req.NISN, req.FullName, req.Gender,
		req.BirthDate, req.BirthPlace, req.Religion, req.Nationality,
		req.BirthCertificateNo, req.KKNumber,
		req.PIPNumber, req.PIPReason,
		req.ChildOrder, req.NumSiblings, req.LivingWith, req.Transportation, req.SpecialNeeds,
		req.Address, req.RtRw, req.Village, req.District, req.City, req.Province, req.PostalCode, req.Phone,
		req.FatherName, req.FatherNIK, req.FatherBirthYear, req.FatherEducation, req.FatherOccupation, req.FatherIncome, req.FatherIsAlive,
		req.MotherName, req.MotherNIK, req.MotherBirthYear, req.MotherEducation, req.MotherOccupation, req.MotherIncome, req.MotherIsAlive,
		req.ParentName, req.ParentPhone,
		req.GuardianName, req.GuardianNIK, req.GuardianPhone, req.GuardianOccupation, req.GuardianRelation,
		req.EnrollmentDate)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan profil siswa: " + err.Error()})
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction commit failed"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Siswa berhasil ditambahkan"})
}

// UpdateStudent updates an existing student profile
func UpdateStudent(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdateStudentRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims != nil && claims.Role == "guru" {
		var allowed bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1
				FROM students s
				JOIN classes c ON c.id = s.class_id
				JOIN teachers t ON t.id = c.homeroom_teacher_id
				WHERE s.id = $1 AND t.nip = $2
			)
		`, id, claims.Identifier).Scan(&allowed)
		if err != nil || !allowed {
			return c.JSON(http.StatusForbidden, map[string]string{"message": "Anda tidak memiliki akses untuk mengubah data siswa ini"})
		}
	}

	_, err := database.DB.Exec(`
		UPDATE students SET
			nis=$1, nisn=$2, full_name=$3, gender=$4,
			birth_date=NULLIF($5,'')::DATE, birth_place=$6, religion=$7, nationality=$8,
			birth_certificate_no=$9, kk_number=$10,
			pip_number=$11, pip_reason=$12,
			child_order=$13, num_siblings=$14, living_with=$15, transportation=$16, special_needs=$17,
			address=$18, rt_rw=$19, village=$20, district=$21, city=$22, province=$23, postal_code=$24, phone=$25,
			father_name=$26, father_nik=$27, father_birth_year=NULLIF($28,0), father_education=NULLIF($29,'')::education_level,
			father_occupation=$30, father_income=NULLIF($31,0), father_is_alive=$32,
			mother_name=$33, mother_nik=$34, mother_birth_year=NULLIF($35,0), mother_education=NULLIF($36,'')::education_level,
			mother_occupation=$37, mother_income=NULLIF($38,0), mother_is_alive=$39,
			parent_name=$40, parent_phone=$41,
			guardian_name=$42, guardian_nik=$43, guardian_phone=$44, guardian_occupation=$45, guardian_relation=$46,
			enrollment_date=NULLIF($47,'')::DATE,
			exit_type=NULLIF($48,'')::student_exit_type, exit_date=NULLIF($49,'')::DATE, exit_reason=$50,
			updated_at=NOW()
		WHERE id=$51
	`,
		req.NIS, req.NISN, req.FullName, req.Gender,
		req.BirthDate, req.BirthPlace, req.Religion, req.Nationality,
		req.BirthCertificateNo, req.KKNumber,
		req.PIPNumber, req.PIPReason,
		req.ChildOrder, req.NumSiblings, req.LivingWith, req.Transportation, req.SpecialNeeds,
		req.Address, req.RtRw, req.Village, req.District, req.City, req.Province, req.PostalCode, req.Phone,
		req.FatherName, req.FatherNIK, req.FatherBirthYear, req.FatherEducation,
		req.FatherOccupation, req.FatherIncome, req.FatherIsAlive,
		req.MotherName, req.MotherNIK, req.MotherBirthYear, req.MotherEducation,
		req.MotherOccupation, req.MotherIncome, req.MotherIsAlive,
		req.ParentName, req.ParentPhone,
		req.GuardianName, req.GuardianNIK, req.GuardianPhone, req.GuardianOccupation, req.GuardianRelation,
		req.EnrollmentDate,
		req.ExitType, req.ExitDate, req.ExitReason,
		id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui data siswa: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Data siswa berhasil diperbarui"})
}

// DeleteStudent removes a student and their user account
func DeleteStudent(c echo.Context) error {
	id := c.Param("id")
	var userID string
	err := database.DB.QueryRow("SELECT user_id FROM students WHERE id = $1", id).Scan(&userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Siswa tidak ditemukan"})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction error"})
	}
	defer tx.Rollback()

	if _, err = tx.Exec("DELETE FROM students WHERE id = $1", id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus data siswa"})
	}
	if _, err = tx.Exec("DELETE FROM users WHERE id = $1", userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus akun siswa"})
	}
	tx.Commit()
	return c.JSON(http.StatusOK, map[string]string{"message": "Data siswa berhasil dihapus"})
}
