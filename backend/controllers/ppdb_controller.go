package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"
)

func PublicRegisterPPDB(c echo.Context) error {
	req := new(models.PublicPPDBRegisterRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	req.FullName = strings.TrimSpace(req.FullName)
	if req.FullName == "" || req.BirthDate == "" || req.ParentPhone == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Nama, tanggal lahir, dan no HP orang tua wajib diisi"})
	}

	regNo := fmt.Sprintf("PPDB-%d", time.Now().UnixNano())
	var id string
	err := database.DB.QueryRow(`
		INSERT INTO ppdb_applications (
			registration_no, full_name, nisn, birth_date, gender, religion, place_of_birth, address,
			previous_school, parent_phone, father_name, father_occupation, father_phone,
			mother_name, mother_occupation, mother_phone, parent_income, document_kk, document_akta
		)
		VALUES (
			$1,$2,$3,$4::DATE,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
		)
		RETURNING id
	`, regNo, req.FullName, req.NISN, req.BirthDate, req.Gender, req.Religion, req.PlaceOfBirth, req.Address,
		req.PreviousSchool, req.ParentPhone, req.FatherName, req.FatherOccupation, req.FatherPhone,
		req.MotherName, req.MotherOccupation, req.MotherPhone, req.ParentIncome, req.DocumentKK, req.DocumentAkta).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat pendaftaran PPDB"})
	}
	return c.JSON(http.StatusCreated, map[string]string{
		"message":         "Pendaftaran berhasil dibuat",
		"id":              id,
		"registration_no": regNo,
	})
}

func PublicCheckPPDBStatus(c echo.Context) error {
	nisn := strings.TrimSpace(c.QueryParam("nisn"))
	if nisn == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "NISN wajib diisi"})
	}

	var item models.PPDBApplication
	err := database.DB.QueryRow(`
		SELECT id, registration_no, full_name, COALESCE(nisn,''), CAST(birth_date AS VARCHAR), 
		       COALESCE(gender,''), COALESCE(religion,''), COALESCE(place_of_birth,''), COALESCE(address,''), 
		       COALESCE(previous_school,''), parent_phone, COALESCE(father_name,''), COALESCE(father_occupation,''), 
		       COALESCE(father_phone,''), COALESCE(mother_name,''), COALESCE(mother_occupation,''), 
		       COALESCE(mother_phone,''), COALESCE(parent_income,''), COALESCE(document_kk,''), COALESCE(document_akta,''),
		       status::VARCHAR, COALESCE(notes_panitia,''), COALESCE(converted_student_id::VARCHAR,''),
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM ppdb_applications
		WHERE nisn = $1
	`, nisn).Scan(
		&item.ID, &item.RegistrationNo, &item.FullName, &item.NISN, &item.BirthDate,
		&item.Gender, &item.Religion, &item.PlaceOfBirth, &item.Address, &item.PreviousSchool,
		&item.ParentPhone, &item.FatherName, &item.FatherOccupation, &item.FatherPhone,
		&item.MotherName, &item.MotherOccupation, &item.MotherPhone, &item.ParentIncome,
		&item.DocumentKK, &item.DocumentAkta, &item.Status, &item.NotesPanitia,
		&item.ConvertedStudent, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Data pendaftaran tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, item)
}

func GetPPDBApplications(c echo.Context) error {
	rows, err := database.DB.Query(`
		SELECT id, registration_no, full_name, COALESCE(nisn,''), CAST(birth_date AS VARCHAR), 
		       COALESCE(gender,''), COALESCE(religion,''), COALESCE(place_of_birth,''), COALESCE(address,''), 
		       COALESCE(previous_school,''), parent_phone, COALESCE(father_name,''), COALESCE(father_occupation,''), 
		       COALESCE(father_phone,''), COALESCE(mother_name,''), COALESCE(mother_occupation,''), 
		       COALESCE(mother_phone,''), COALESCE(parent_income,''), COALESCE(document_kk,''), COALESCE(document_akta,''),
		       status::VARCHAR, COALESCE(notes_panitia,''), COALESCE(converted_student_id::VARCHAR,''),
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM ppdb_applications
		ORDER BY created_at DESC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data PPDB"})
	}
	defer rows.Close()
	items := []models.PPDBApplication{}
	for rows.Next() {
		var item models.PPDBApplication
		if err := rows.Scan(
			&item.ID, &item.RegistrationNo, &item.FullName, &item.NISN, &item.BirthDate,
			&item.Gender, &item.Religion, &item.PlaceOfBirth, &item.Address, &item.PreviousSchool,
			&item.ParentPhone, &item.FatherName, &item.FatherOccupation, &item.FatherPhone,
			&item.MotherName, &item.MotherOccupation, &item.MotherPhone, &item.ParentIncome,
			&item.DocumentKK, &item.DocumentAkta, &item.Status, &item.NotesPanitia,
			&item.ConvertedStudent, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data PPDB"})
		}
		items = append(items, item)
	}
	return c.JSON(http.StatusOK, items)
}

func GetPPDBApplicationByID(c echo.Context) error {
	id := c.Param("id")
	var item models.PPDBApplication
	err := database.DB.QueryRow(`
		SELECT id, registration_no, full_name, COALESCE(nisn,''), CAST(birth_date AS VARCHAR), 
		       COALESCE(gender,''), COALESCE(religion,''), COALESCE(place_of_birth,''), COALESCE(address,''), 
		       COALESCE(previous_school,''), parent_phone, COALESCE(father_name,''), COALESCE(father_occupation,''), 
		       COALESCE(father_phone,''), COALESCE(mother_name,''), COALESCE(mother_occupation,''), 
		       COALESCE(mother_phone,''), COALESCE(parent_income,''), COALESCE(document_kk,''), COALESCE(document_akta,''),
		       status::VARCHAR, COALESCE(notes_panitia,''), COALESCE(converted_student_id::VARCHAR,''),
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM ppdb_applications
		WHERE id = $1
	`, id).Scan(
		&item.ID, &item.RegistrationNo, &item.FullName, &item.NISN, &item.BirthDate,
		&item.Gender, &item.Religion, &item.PlaceOfBirth, &item.Address, &item.PreviousSchool,
		&item.ParentPhone, &item.FatherName, &item.FatherOccupation, &item.FatherPhone,
		&item.MotherName, &item.MotherOccupation, &item.MotherPhone, &item.ParentIncome,
		&item.DocumentKK, &item.DocumentAkta, &item.Status, &item.NotesPanitia,
		&item.ConvertedStudent, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Data pendaftaran tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, item)
}

func UpdatePPDBStatus(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdatePPDBStatusRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.Status == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Status wajib diisi"})
	}
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}

	_, err := database.DB.Exec(`
		UPDATE ppdb_applications SET
			status = $1::ppdb_status,
			notes_panitia = $2,
			status_updated_at = NOW(),
			status_updated_by = NULLIF($3,'')::UUID,
			updated_at = NOW()
		WHERE id = $4
	`, req.Status, req.NotesPanitia, userID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui status PPDB"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Status PPDB berhasil diperbarui"})
}

func ConvertPPDBToStudent(c echo.Context) error {
	id := c.Param("id")
	req := new(models.ConvertPPDBToStudentRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	req.NIS = strings.TrimSpace(req.NIS)
	req.Gender = strings.TrimSpace(req.Gender)
	if req.NIS == "" || req.Password == "" || (req.Gender != "L" && req.Gender != "P") {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "NIS, password, dan gender (L/P) wajib valid"})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memulai transaksi"})
	}
	defer tx.Rollback()

	var fullName, nisn, birthDate, parentPhone string
	var convertedStudentID string
	err = tx.QueryRow(`
		SELECT
			full_name,
			COALESCE(nisn, ''),
			CAST(birth_date AS VARCHAR),
			parent_phone,
			COALESCE(converted_student_id::VARCHAR, '')
		FROM ppdb_applications
		WHERE id = $1
	`, id).Scan(&fullName, &nisn, &birthDate, &parentPhone, &convertedStudentID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Data PPDB tidak ditemukan"})
	}
	if convertedStudentID != "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Pendaftar ini sudah dikonversi menjadi siswa"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memproses password"})
	}

	var userID string
	err = tx.QueryRow(`
		INSERT INTO users (identifier, password_hash, role, is_active, must_change_password)
		VALUES ($1, $2, 'siswa', true, true)
		RETURNING id
	`, req.NIS, string(hashedPassword)).Scan(&userID)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"message": "NIS sudah digunakan pada akun lain"})
	}

	var studentID string
	err = tx.QueryRow(`
		INSERT INTO students (
			user_id, nis, nisn, full_name, gender,
			birth_date, parent_phone, enrollment_date, class_id, is_active
		) VALUES (
			$1, $2, NULLIF($3,''), $4, $5::gender_type,
			NULLIF($6,'')::DATE, NULLIF($7,''), NULLIF($8,'')::DATE, NULLIF($9,'')::UUID, true
		)
		RETURNING id
	`, userID, req.NIS, nisn, fullName, req.Gender, birthDate, parentPhone, req.EnrollmentDate, req.ClassID).Scan(&studentID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat data siswa: " + err.Error()})
	}

	_, err = tx.Exec(`
		UPDATE ppdb_applications SET
			status = 'daftar_ulang'::ppdb_status,
			converted_student_id = $1::UUID,
			updated_at = NOW()
		WHERE id = $2
	`, studentID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengupdate status konversi PPDB"})
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan transaksi"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":    "Berhasil mengonversi pendaftar menjadi siswa aktif",
		"student_id": studentID,
	})
}

// Admin Create PPDB Application
func CreatePPDBApplication(c echo.Context) error {
	req := new(models.PublicPPDBRegisterRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	req.FullName = strings.TrimSpace(req.FullName)
	if req.FullName == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Nama wajib diisi"})
	}

	regNo := fmt.Sprintf("PPDB-ADMIN-%d", time.Now().UnixNano())
	var id string
	err := database.DB.QueryRow(`
		INSERT INTO ppdb_applications (
			registration_no, full_name, nisn, birth_date, gender, religion, place_of_birth, address,
			previous_school, parent_phone, father_name, father_occupation, father_phone,
			mother_name, mother_occupation, mother_phone, parent_income, document_kk, document_akta
		)
		VALUES (
			$1,$2,$3,NULLIF($4,'')::DATE,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
		)
		RETURNING id
	`, regNo, req.FullName, req.NISN, req.BirthDate, req.Gender, req.Religion, req.PlaceOfBirth, req.Address,
		req.PreviousSchool, req.ParentPhone, req.FatherName, req.FatherOccupation, req.FatherPhone,
		req.MotherName, req.MotherOccupation, req.MotherPhone, req.ParentIncome, req.DocumentKK, req.DocumentAkta).Scan(&id)
	if err != nil {
		fmt.Println("Error inserting PPDB admin:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat pendaftaran PPDB"})
	}
	return c.JSON(http.StatusCreated, map[string]string{
		"message":         "Pendaftaran berhasil dibuat",
		"id":              id,
		"registration_no": regNo,
	})
}

// Admin Update PPDB Application
func UpdatePPDBApplication(c echo.Context) error {
	id := c.Param("id")
	req := new(models.PublicPPDBRegisterRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	req.FullName = strings.TrimSpace(req.FullName)
	if req.FullName == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Nama wajib diisi"})
	}

	_, err := database.DB.Exec(`
		UPDATE ppdb_applications SET 
			full_name = $1, nisn = $2, birth_date = NULLIF($3,'')::DATE, gender = $4, religion = $5,
			place_of_birth = $6, address = $7, previous_school = $8, parent_phone = $9,
			father_name = $10, father_occupation = $11, father_phone = $12,
			mother_name = $13, mother_occupation = $14, mother_phone = $15,
			parent_income = $16, document_kk = $17, document_akta = $18, updated_at = NOW()
		WHERE id = $19
	`, req.FullName, req.NISN, req.BirthDate, req.Gender, req.Religion, req.PlaceOfBirth, req.Address,
		req.PreviousSchool, req.ParentPhone, req.FatherName, req.FatherOccupation, req.FatherPhone,
		req.MotherName, req.MotherOccupation, req.MotherPhone, req.ParentIncome, req.DocumentKK, req.DocumentAkta, id)

	if err != nil {
		fmt.Println("Error updating PPDB admin:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengubah data PPDB"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Data pendaftar berhasil diubah"})
}
