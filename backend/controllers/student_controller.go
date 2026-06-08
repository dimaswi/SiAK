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

type PaginationMeta struct {
	TotalItems  int `json:"total_items"`
	TotalPages  int `json:"total_pages"`
	CurrentPage int `json:"current_page"`
	Limit       int `json:"limit"`
}

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
		s.nis, COALESCE(s.nism,''), COALESCE(s.nisn,''), COALESCE(s.nik,''), s.full_name, s.gender,
		COALESCE(CAST(s.birth_date AS VARCHAR),''), COALESCE(s.birth_place,''),
		COALESCE(s.religion,''), COALESCE(s.nationality,''),
		COALESCE(s.birth_certificate_no,''), COALESCE(s.kk_number,''),
		COALESCE(s.kks_number,''), COALESCE(s.kps_number,''), COALESCE(s.kip_number,''), COALESCE(s.pkh_number,''), COALESCE(s.kis_number,''),
		COALESCE(s.is_pip_receiver, false), COALESCE(s.pip_number,''), COALESCE(s.pip_reason,''), COALESCE(s.pip_period,''),
		COALESCE(s.child_order,0), COALESCE(s.num_siblings,0),
		COALESCE(s.living_with,''), COALESCE(s.transportation,''),
		COALESCE(s.special_needs,''), COALESCE(s.hobby,''), COALESCE(s.ambition,''),
		COALESCE(s.address,''), COALESCE(s.rt_rw,''), COALESCE(s.village,''),
		COALESCE(s.district,''), COALESCE(s.city,''), COALESCE(s.province,''),
		COALESCE(s.postal_code,''), COALESCE(s.phone,''),
		COALESCE(s.class_id::VARCHAR,''), COALESCE(s.class_absent_number,''), COALESCE(s.class_rank,0),
		COALESCE(s.achievement_field,''), COALESCE(s.achievement_level,''), COALESCE(s.achievement_rank,''), COALESCE(s.achievement_year,0),
		COALESCE(s.scholarship_status,''), COALESCE(s.scholarship_source,''), COALESCE(s.scholarship_type,''), COALESCE(s.scholarship_duration_months,0), COALESCE(s.scholarship_amount,0),
		COALESCE(s.previous_school_type,''), COALESCE(s.previous_school_status,''), COALESCE(s.previous_school_city,''),
		COALESCE(s.father_name,''), COALESCE(s.father_nik,''),
		COALESCE(s.father_birth_year,0), COALESCE(CAST(s.father_birth_date AS VARCHAR),''), COALESCE(s.father_education::VARCHAR,''),
		COALESCE(s.father_occupation,''), COALESCE(s.father_income,0),
		COALESCE(s.father_is_alive, true),
		COALESCE(s.mother_name,''), COALESCE(s.mother_nik,''),
		COALESCE(s.mother_birth_year,0), COALESCE(CAST(s.mother_birth_date AS VARCHAR),''), COALESCE(s.mother_education::VARCHAR,''),
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
		&s.NIS, &s.NISM, &s.NISN, &s.NIK, &s.FullName, &s.Gender,
		&s.BirthDate, &s.BirthPlace,
		&s.Religion, &s.Nationality,
		&s.BirthCertificateNo, &s.KKNumber,
		&s.KKSNumber, &s.KPSNumber, &s.KIPNumber, &s.PKHNumber, &s.KISNumber,
		&s.IsPIPReceiver, &s.PIPNumber, &s.PIPReason, &s.PIPPeriod,
		&s.ChildOrder, &s.NumSiblings,
		&s.LivingWith, &s.Transportation,
		&s.SpecialNeeds, &s.Hobby, &s.Ambition,
		&s.Address, &s.RtRw, &s.Village,
		&s.District, &s.City, &s.Province,
		&s.PostalCode, &s.Phone,
		&s.ClassID, &s.ClassAbsentNumber, &s.ClassRank,
		&s.AchievementField, &s.AchievementLevel, &s.AchievementRank, &s.AchievementYear,
		&s.ScholarshipStatus, &s.ScholarshipSource, &s.ScholarshipType, &s.ScholarshipDurationMonths, &s.ScholarshipAmount,
		&s.PreviousSchoolType, &s.PreviousSchoolStatus, &s.PreviousSchoolCity,
		&s.FatherName, &s.FatherNIK,
		&s.FatherBirthYear, &s.FatherBirthDate, &s.FatherEducation,
		&s.FatherOccupation, &s.FatherIncome,
		&s.FatherIsAlive,
		&s.MotherName, &s.MotherNIK,
		&s.MotherBirthYear, &s.MotherBirthDate, &s.MotherEducation,
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

func GetStudents(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 { page = 1 }
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 { limit = 10 }
	offset := (page - 1) * limit
	search := "%" + c.QueryParam("search") + "%"

	var totalItems int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM students s
		WHERE s.full_name ILIKE $1 OR s.nis ILIKE $1 OR COALESCE(s.nisn,'') ILIKE $1
	`, search).Scan(&totalItems)
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to count students"}) }

	query := studentSelectFields + `
		WHERE s.full_name ILIKE $1 OR s.nis ILIKE $1 OR COALESCE(s.nisn,'') ILIKE $1
		ORDER BY s.full_name ASC
		LIMIT $2 OFFSET $3
	`
	rows, err := database.DB.Query(query, search, limit, offset)
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch students"}) }
	defer rows.Close()

	students := []models.Student{}
	for rows.Next() {
		s, err := scanStudent(rows)
		if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to parse student data"}) }
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

func GetStudentByID(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims != nil && claims.Role == "guru" {
		var allowed bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM students s
				JOIN classes c ON c.id = s.class_id
				JOIN teachers t ON t.id = c.homeroom_teacher_id
				WHERE s.id = $1 AND t.nip = $2
			)
		`, id, claims.Identifier).Scan(&allowed)
		if err != nil || !allowed { return c.JSON(http.StatusForbidden, map[string]string{"message": "Anda tidak memiliki akses ke data siswa ini"}) }
	}

	row := database.DB.QueryRow(studentSelectFields+"WHERE s.id = $1", id)
	s, err := scanStudent(row)
	if err != nil { return c.JSON(http.StatusNotFound, map[string]string{"message": "Student not found"}) }
	return c.JSON(http.StatusOK, s)
}

func CreateStudent(c echo.Context) error {
	req := new(models.CreateStudentRequest)
	if err := c.Bind(req); err != nil { return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"}) }
	if req.NIS == "" || req.FullName == "" || req.Password == "" || req.Gender == "" { return c.JSON(http.StatusBadRequest, map[string]string{"message": "NIS, Nama Lengkap, Jenis Kelamin, dan Password wajib diisi"}) }

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to process password"}) }

	tx, err := database.DB.Begin()
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction error"}) }
	defer tx.Rollback()

	var userID string
	err = tx.QueryRow(`
		INSERT INTO users (identifier, password_hash, role, is_active, must_change_password)
		VALUES ($1, $2, 'siswa', true, true) RETURNING id
	`, req.NIS, string(hashedPassword)).Scan(&userID)
	if err != nil { return c.JSON(http.StatusConflict, map[string]string{"message": "Siswa dengan NIS ini sudah terdaftar"}) }

	_, err = tx.Exec(`
		INSERT INTO students (
			user_id, nis, nism, nisn, nik, full_name, gender,
			birth_date, birth_place, religion, nationality,
			birth_certificate_no, kk_number,
			kks_number, kps_number, kip_number, pkh_number, kis_number,
			is_pip_receiver, pip_number, pip_reason, pip_period,
			child_order, num_siblings, living_with, transportation, special_needs, hobby, ambition,
			address, rt_rw, village, district, city, province, postal_code, phone,
			class_absent_number, class_rank,
			achievement_field, achievement_level, achievement_rank, achievement_year,
			scholarship_status, scholarship_source, scholarship_type, scholarship_duration_months, scholarship_amount,
			previous_school_type, previous_school_status, previous_school_city,
			father_name, father_nik, father_birth_year, father_birth_date, father_education, father_occupation, father_income, father_is_alive,
			mother_name, mother_nik, mother_birth_year, mother_birth_date, mother_education, mother_occupation, mother_income, mother_is_alive,
			parent_name, parent_phone,
			guardian_name, guardian_nik, guardian_phone, guardian_occupation, guardian_relation,
			enrollment_date
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,
			NULLIF($8,'')::DATE,$9,$10,$11,
			$12,$13,
			$14,$15,$16,$17,$18,
			$19,$20,$21,$22,
			$23,$24,$25,$26,$27,$28,$29,
			$30,$31,$32,$33,$34,$35,$36,$37,
			$38,$39,
			$40,$41,$42,$43,
			$44,$45,$46,$47,$48,
			$49,$50,$51,
			$52,$53,NULLIF($54,0),NULLIF($55::text,'')::DATE,NULLIF($56::text,'')::education_level,$57,NULLIF($58,0),$59,
			$60,$61,NULLIF($62,0),NULLIF($63::text,'')::DATE,NULLIF($64::text,'')::education_level,$65,NULLIF($66,0),$67,
			$68,$69,
			$70,$71,$72,$73,$74,
			NULLIF($75,'')::DATE
		)
	`, userID, req.NIS, req.NISM, req.NISN, req.NIK, req.FullName, req.Gender,
		req.BirthDate, req.BirthPlace, req.Religion, req.Nationality,
		req.BirthCertificateNo, req.KKNumber,
		req.KKSNumber, req.KPSNumber, req.KIPNumber, req.PKHNumber, req.KISNumber,
		req.IsPIPReceiver, req.PIPNumber, req.PIPReason, req.PIPPeriod,
		req.ChildOrder, req.NumSiblings, req.LivingWith, req.Transportation, req.SpecialNeeds, req.Hobby, req.Ambition,
		req.Address, req.RtRw, req.Village, req.District, req.City, req.Province, req.PostalCode, req.Phone,
		req.ClassAbsentNumber, req.ClassRank,
		req.AchievementField, req.AchievementLevel, req.AchievementRank, req.AchievementYear,
		req.ScholarshipStatus, req.ScholarshipSource, req.ScholarshipType, req.ScholarshipDurationMonths, req.ScholarshipAmount,
		req.PreviousSchoolType, req.PreviousSchoolStatus, req.PreviousSchoolCity,
		req.FatherName, req.FatherNIK, req.FatherBirthYear, req.FatherBirthDate, req.FatherEducation, req.FatherOccupation, req.FatherIncome, req.FatherIsAlive,
		req.MotherName, req.MotherNIK, req.MotherBirthYear, req.MotherBirthDate, req.MotherEducation, req.MotherOccupation, req.MotherIncome, req.MotherIsAlive,
		req.ParentName, req.ParentPhone,
		req.GuardianName, req.GuardianNIK, req.GuardianPhone, req.GuardianOccupation, req.GuardianRelation,
		req.EnrollmentDate)
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan profil siswa: " + err.Error()}) }

	if err := tx.Commit(); err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction commit failed"}) }
	return c.JSON(http.StatusCreated, map[string]string{"message": "Siswa berhasil ditambahkan"})
}

func UpdateStudent(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdateStudentRequest)
	if err := c.Bind(req); err != nil { return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"}) }
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims != nil && claims.Role == "guru" {
		var allowed bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM students s
				JOIN classes c ON c.id = s.class_id
				JOIN teachers t ON t.id = c.homeroom_teacher_id
				WHERE s.id = $1 AND t.nip = $2
			)
		`, id, claims.Identifier).Scan(&allowed)
		if err != nil || !allowed { return c.JSON(http.StatusForbidden, map[string]string{"message": "Anda tidak memiliki akses untuk mengubah data siswa ini"}) }
	}

	_, err := database.DB.Exec(`
		UPDATE students SET
			nis=$1, nism=$2, nisn=$3, nik=$4, full_name=$5, gender=$6,
			birth_date=NULLIF($7,'')::DATE, birth_place=$8, religion=$9, nationality=$10,
			birth_certificate_no=$11, kk_number=$12,
			kks_number=$13, kps_number=$14, kip_number=$15, pkh_number=$16, kis_number=$17,
			is_pip_receiver=$18, pip_number=$19, pip_reason=$20, pip_period=$21,
			child_order=$22, num_siblings=$23, living_with=$24, transportation=$25, special_needs=$26, hobby=$27, ambition=$28,
			address=$29, rt_rw=$30, village=$31, district=$32, city=$33, province=$34, postal_code=$35, phone=$36,
			class_absent_number=$37, class_rank=$38,
			achievement_field=$39, achievement_level=$40, achievement_rank=$41, achievement_year=$42,
			scholarship_status=$43, scholarship_source=$44, scholarship_type=$45, scholarship_duration_months=$46, scholarship_amount=$47,
			previous_school_type=$48, previous_school_status=$49, previous_school_city=$50,
			father_name=$51, father_nik=$52, father_birth_year=NULLIF($53,0), father_birth_date=NULLIF($54::text,'')::DATE, father_education=NULLIF($55::text,'')::education_level, father_occupation=$56, father_income=NULLIF($57,0), father_is_alive=$58,
			mother_name=$59, mother_nik=$60, mother_birth_year=NULLIF($61,0), mother_birth_date=NULLIF($62::text,'')::DATE, mother_education=NULLIF($63::text,'')::education_level, mother_occupation=$64, mother_income=NULLIF($65,0), mother_is_alive=$66,
			parent_name=$67, parent_phone=$68,
			guardian_name=$69, guardian_nik=$70, guardian_phone=$71, guardian_occupation=$72, guardian_relation=$73,
			enrollment_date=NULLIF($74,'')::DATE,
			exit_type=NULLIF($75,'')::student_exit_type, exit_date=NULLIF($76,'')::DATE, exit_reason=$77,
			updated_at=NOW()
		WHERE id=$78
	`,
		req.NIS, req.NISM, req.NISN, req.NIK, req.FullName, req.Gender,
		req.BirthDate, req.BirthPlace, req.Religion, req.Nationality,
		req.BirthCertificateNo, req.KKNumber,
		req.KKSNumber, req.KPSNumber, req.KIPNumber, req.PKHNumber, req.KISNumber,
		req.IsPIPReceiver, req.PIPNumber, req.PIPReason, req.PIPPeriod,
		req.ChildOrder, req.NumSiblings, req.LivingWith, req.Transportation, req.SpecialNeeds, req.Hobby, req.Ambition,
		req.Address, req.RtRw, req.Village, req.District, req.City, req.Province, req.PostalCode, req.Phone,
		req.ClassAbsentNumber, req.ClassRank,
		req.AchievementField, req.AchievementLevel, req.AchievementRank, req.AchievementYear,
		req.ScholarshipStatus, req.ScholarshipSource, req.ScholarshipType, req.ScholarshipDurationMonths, req.ScholarshipAmount,
		req.PreviousSchoolType, req.PreviousSchoolStatus, req.PreviousSchoolCity,
		req.FatherName, req.FatherNIK, req.FatherBirthYear, req.FatherBirthDate, req.FatherEducation,
		req.FatherOccupation, req.FatherIncome, req.FatherIsAlive,
		req.MotherName, req.MotherNIK, req.MotherBirthYear, req.MotherBirthDate, req.MotherEducation,
		req.MotherOccupation, req.MotherIncome, req.MotherIsAlive,
		req.ParentName, req.ParentPhone,
		req.GuardianName, req.GuardianNIK, req.GuardianPhone, req.GuardianOccupation, req.GuardianRelation,
		req.EnrollmentDate,
		req.ExitType, req.ExitDate, req.ExitReason,
		id)
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui data siswa: " + err.Error()}) }
	return c.JSON(http.StatusOK, map[string]string{"message": "Data siswa berhasil diperbarui"})
}

func DeleteStudent(c echo.Context) error {
	id := c.Param("id")
	var userID string
	err := database.DB.QueryRow("SELECT user_id FROM students WHERE id = $1", id).Scan(&userID)
	if err != nil { return c.JSON(http.StatusNotFound, map[string]string{"message": "Siswa tidak ditemukan"}) }

	tx, err := database.DB.Begin()
	if err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction error"}) }
	defer tx.Rollback()

	if _, err = tx.Exec("DELETE FROM students WHERE id = $1", id); err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus data siswa"}) }
	if _, err = tx.Exec("DELETE FROM users WHERE id = $1", userID); err != nil { return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus akun siswa"}) }
	tx.Commit()
	return c.JSON(http.StatusOK, map[string]string{"message": "Data siswa berhasil dihapus"})
}
