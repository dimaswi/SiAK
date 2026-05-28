package controllers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"
)

// ============================================================
// SPP SETTINGS
// ============================================================

// GetSppSettings lists all SPP setting configurations
func GetSppSettings(c echo.Context) error {
	rows, err := database.DB.Query(`
		SELECT s.id, s.academic_year, s.grade_level, s.class_id::VARCHAR, COALESCE(c.name,'') as class_name, 
		       s.amount, COALESCE(s.description,''), s.is_active, CAST(s.created_at AS VARCHAR)
		FROM spp_settings s
		LEFT JOIN classes c ON c.id = s.class_id
		ORDER BY s.academic_year DESC, s.grade_level ASC NULLS LAST
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data setting SPP"})
	}
	defer rows.Close()

	settings := []models.SppSetting{}
	for rows.Next() {
		var s models.SppSetting
		var classID, className *string
		if err := rows.Scan(&s.ID, &s.AcademicYear, &s.GradeLevel, &classID, &className, &s.Amount, &s.Description, &s.IsActive, &s.CreatedAt); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data setting SPP"})
		}
		if classID != nil {
			s.ClassID = classID
			s.ClassName = className
		}
		settings = append(settings, s)
	}
	return c.JSON(http.StatusOK, settings)
}

// CreateSppSetting creates a new SPP amount configuration
func CreateSppSetting(c echo.Context) error {
	req := new(models.CreateSppSettingRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.AcademicYear == "" || req.Amount <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Tahun ajaran dan nominal SPP wajib diisi"})
	}

	var classID interface{}
	if req.ClassID != nil && *req.ClassID != "" {
		classID = *req.ClassID
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO spp_settings (academic_year, grade_level, class_id, amount, description)
		VALUES ($1, $2, $3, $4, $5) RETURNING id
	`, req.AcademicYear, req.GradeLevel, classID, req.Amount, req.Description).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan setting SPP: " + err.Error()})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Setting SPP berhasil disimpan", "id": id})
}

// DeleteSppSetting removes a SPP setting
func DeleteSppSetting(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec("DELETE FROM spp_settings WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus setting SPP"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Setting SPP berhasil dihapus"})
}

// ============================================================
// SPP PAYMENTS
// ============================================================

const sppPaymentSelect = `
	SELECT
		p.id, p.student_id,
		COALESCE(s.full_name,'') AS student_name,
		COALESCE(s.nis,'') AS student_nis,
		COALESCE(cl.name,'') AS class_name,
		COALESCE(p.spp_setting_id::VARCHAR,''),
		p.academic_year, p.month, p.year,
		p.amount, p.late_fee, p.discount,
		(p.amount + p.late_fee - p.discount) AS total_amount,
		CAST(p.due_date AS VARCHAR),
		p.status::VARCHAR,
		COALESCE(CAST(p.payment_date AS VARCHAR),''),
		COALESCE(p.bank_name,''), COALESCE(p.account_holder,''),
		COALESCE(p.transaction_id,''), COALESCE(p.payment_proof_url,''),
		COALESCE(p.verified_by::VARCHAR,''),
		COALESCE(CAST(p.verified_at AS VARCHAR),''),
		COALESCE(CAST(p.paid_at AS VARCHAR),''),
		COALESCE(p.notes,''),
		CAST(p.created_at AS VARCHAR), CAST(p.updated_at AS VARCHAR)
	FROM spp_payments p
	JOIN students s ON s.id = p.student_id
	LEFT JOIN classes cl ON cl.id = s.class_id
`

func scanSppPayment(row interface{ Scan(...interface{}) error }) (models.SppPayment, error) {
	var p models.SppPayment
	err := row.Scan(
		&p.ID, &p.StudentID,
		&p.StudentName, &p.StudentNIS, &p.ClassName,
		&p.SppSettingID,
		&p.AcademicYear, &p.Month, &p.Year,
		&p.Amount, &p.LateFee, &p.Discount, &p.TotalAmount,
		&p.DueDate, &p.Status,
		&p.PaymentDate, &p.BankName, &p.AccountHolder,
		&p.TransactionID, &p.PaymentProofURL,
		&p.VerifiedBy, &p.VerifiedAt, &p.PaidAt,
		&p.Notes,
		&p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

// GetSppPayments lists SPP payments with filters and pagination
func GetSppPayments(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Build filter
	filterStatus := c.QueryParam("status")
	filterYear := c.QueryParam("year")
	filterMonth := c.QueryParam("month")
	filterStudentID := c.QueryParam("student_id")
	search := "%" + c.QueryParam("search") + "%"
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	teacherID := ""
	if claims != nil && claims.Role == "guru" {
		_ = database.DB.QueryRow("SELECT id FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherID)
	}

	whereClause := " WHERE (s.full_name ILIKE $1 OR s.nis ILIKE $1)"
	args := []interface{}{search}
	argIdx := 2

	if filterStatus != "" {
		whereClause += fmt.Sprintf(" AND p.status = $%d::spp_payment_status", argIdx)
		args = append(args, filterStatus)
		argIdx++
	}
	if filterYear != "" {
		whereClause += fmt.Sprintf(" AND p.year = $%d", argIdx)
		args = append(args, filterYear)
		argIdx++
	}
	if filterMonth != "" {
		whereClause += fmt.Sprintf(" AND p.month = $%d", argIdx)
		args = append(args, filterMonth)
		argIdx++
	}
	if filterStudentID != "" {
		whereClause += fmt.Sprintf(" AND p.student_id = $%d", argIdx)
		args = append(args, filterStudentID)
		argIdx++
	}
	if teacherID != "" {
		whereClause += fmt.Sprintf(" AND cl.homeroom_teacher_id = $%d", argIdx)
		args = append(args, teacherID)
		argIdx++
	}

	var totalItems int
	countQuery := "SELECT COUNT(*) FROM spp_payments p JOIN students s ON s.id = p.student_id LEFT JOIN classes cl ON cl.id = s.class_id" + whereClause
	if err := database.DB.QueryRow(countQuery, args...).Scan(&totalItems); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghitung data SPP"})
	}

	orderClause := fmt.Sprintf(" ORDER BY p.year DESC, p.month DESC, s.full_name ASC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(sppPaymentSelect+whereClause+orderClause, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data SPP: " + err.Error()})
	}
	defer rows.Close()

	payments := []models.SppPayment{}
	for rows.Next() {
		p, err := scanSppPayment(rows)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data SPP"})
		}
		payments = append(payments, p)
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": payments,
		"meta": PaginationMeta{
			TotalItems:  totalItems,
			TotalPages:  totalPages,
			CurrentPage: page,
			Limit:       limit,
		},
	})
}

// GetSppPaymentByID gets detail of one SPP payment
func GetSppPaymentByID(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	teacherID := ""
	if claims != nil && claims.Role == "guru" {
		_ = database.DB.QueryRow("SELECT id FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherID)
	}

	query := sppPaymentSelect + " WHERE p.id = $1"
	args := []interface{}{id}
	if teacherID != "" {
		query += " AND cl.homeroom_teacher_id = $2"
		args = append(args, teacherID)
	}
	row := database.DB.QueryRow(query, args...)
	p, err := scanSppPayment(row)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Tagihan SPP tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, p)
}

// GetStudentSppHistory gets all SPP payments for a specific student
func GetStudentSppHistory(c echo.Context) error {
	studentID := c.Param("student_id")
	if claims, ok := c.Get("user").(*middlewares.JwtCustomClaims); ok && claims != nil {
		if claims.Role == "siswa" || claims.Role == "wali_murid" || studentID == "me" {
			err := database.DB.QueryRow("SELECT id FROM students WHERE nis = $1", claims.Identifier).Scan(&studentID)
			if err != nil {
				return c.JSON(http.StatusForbidden, map[string]string{"message": "Data siswa untuk akun ini tidak ditemukan"})
			}
		}
	}

	rows, err := database.DB.Query(sppPaymentSelect+" WHERE p.student_id = $1 ORDER BY p.year DESC, p.month DESC", studentID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil riwayat SPP"})
	}
	defer rows.Close()

	payments := []models.SppPayment{}
	for rows.Next() {
		p, err := scanSppPayment(rows)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca riwayat SPP"})
		}
		payments = append(payments, p)
	}

	// Calculate summary
	var summary models.SppSummary
	summary.StudentID = studentID
	for _, p := range payments {
		summary.TotalBilled += p.TotalAmount
		if p.Status == "lunas" {
			summary.TotalPaid += p.TotalAmount
			summary.PaidCount++
		} else if p.Status == "belum_bayar" || p.Status == "pending_verifikasi" {
			summary.TotalPending += p.TotalAmount
			summary.UnpaidCount++
		}
	}
	summary.Arrears = summary.TotalBilled - summary.TotalPaid

	return c.JSON(http.StatusOK, map[string]interface{}{
		"payments": payments,
		"summary":  summary,
	})
}

// CreateSppPayment creates a single manual SPP payment record
func CreateSppPayment(c echo.Context) error {
	req := new(models.CreateSppPaymentRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.StudentID == "" || req.Month == 0 || req.Year == 0 || req.Amount <= 0 || req.DueDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Student ID, bulan, tahun, nominal, dan tanggal jatuh tempo wajib diisi"})
	}

	// Check duplicate
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM spp_payments WHERE student_id=$1 AND month=$2 AND year=$3)",
		req.StudentID, req.Month, req.Year).Scan(&exists)
	if exists {
		return c.JSON(http.StatusConflict, map[string]string{"message": fmt.Sprintf("Tagihan SPP bulan %d tahun %d untuk siswa ini sudah ada", req.Month, req.Year)})
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO spp_payments (student_id, spp_setting_id, academic_year, month, year, amount, late_fee, discount, due_date, notes)
		VALUES ($1, NULLIF($2,'')::UUID, $3, $4, $5, $6, $7, $8, $9::DATE, $10)
		RETURNING id
	`, req.StudentID, req.SppSettingID, req.AcademicYear, req.Month, req.Year,
		req.Amount, req.LateFee, req.Discount, req.DueDate, req.Notes).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat tagihan SPP: " + err.Error()})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Tagihan SPP berhasil dibuat", "id": id})
}

// GenerateSppBulk generates monthly SPP bills for all active students
func GenerateSppBulk(c echo.Context) error {
	req := new(models.GenerateSppRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.Month == 0 || req.Year == 0 || req.DueDate == "" || req.AcademicYear == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Bulan, tahun, tahun ajaran, dan tanggal jatuh tempo wajib diisi"})
	}

	// Fetch all active students with their class grade_level and class_id
	rows, err := database.DB.Query(`
		SELECT s.id, COALESCE(cl.grade_level, 0), s.class_id::VARCHAR
		FROM students s
		LEFT JOIN classes cl ON cl.id = s.class_id
		WHERE s.is_active = true
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data siswa aktif"})
	}
	defer rows.Close()

	type studentInfo struct {
		ID         string
		GradeLevel int
		ClassID    string
	}
	var students []studentInfo
	for rows.Next() {
		var si studentInfo
		var cid *string
		rows.Scan(&si.ID, &si.GradeLevel, &cid)
		if cid != nil {
			si.ClassID = *cid
		}
		students = append(students, si)
	}

	if len(students) == 0 {
		return c.JSON(http.StatusOK, map[string]interface{}{"message": "Tidak ada siswa aktif", "created": 0, "skipped": 0})
	}

	// Get SPP amounts per grade level / class from settings
	type settingInfo struct {
		Amount int64
	}
	// Caches: specific class -> amount, specific grade -> amount, global -> amount
	classSettingCache := map[string]settingInfo{}
	gradeSettingCache := map[int]settingInfo{}

	// Cache settings
	settingRows, _ := database.DB.Query(`
		SELECT COALESCE(grade_level, 0), class_id::VARCHAR, amount
		FROM spp_settings
		WHERE academic_year = $1 AND is_active = true
	`, req.AcademicYear)
	if settingRows != nil {
		defer settingRows.Close()
		for settingRows.Next() {
			var gl int
			var cid *string
			var amt int64
			settingRows.Scan(&gl, &cid, &amt)
			if cid != nil && *cid != "" {
				classSettingCache[*cid] = settingInfo{Amount: amt}
			} else {
				gradeSettingCache[gl] = settingInfo{Amount: amt}
			}
		}
	}

	created := 0
	skipped := 0

	tx, err := database.DB.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction error"})
	}
	defer tx.Rollback()

	for _, student := range students {
		// Priority 1: Specific class setting
		// Priority 2: Specific grade setting
		// Priority 3: Global setting (grade 0)
		var amount int64
		if student.ClassID != "" {
			if s, ok := classSettingCache[student.ClassID]; ok {
				amount = s.Amount
				goto Found
			}
		}
		if s, ok := gradeSettingCache[student.GradeLevel]; ok {
			amount = s.Amount
			goto Found
		}
		if s, ok := gradeSettingCache[0]; ok {
			amount = s.Amount
			goto Found
		}
		
		// Skip if no setting found
		skipped++
		continue

	Found:
		_, err = tx.Exec(`
			INSERT INTO spp_payments (student_id, academic_year, month, year, amount, due_date)
			VALUES ($1, $2, $3, $4, $5, $6::DATE)
			ON CONFLICT (student_id, month, year) DO NOTHING
		`, student.ID, req.AcademicYear, req.Month, req.Year, amount, req.DueDate)
		if err != nil {
			skipped++
		} else {
			created++
		}
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Transaction commit failed"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("Generate SPP selesai: %d tagihan dibuat, %d dilewati", created, skipped),
		"created": created,
		"skipped": skipped,
	})
}

// UpdateSppPayment updates payment information on a billing record
func UpdateSppPayment(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdateSppPaymentRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
	}

	var err error
	if claims.Role == "siswa" || claims.Role == "wali_murid" {
		// Students/parents can only update their own payment detail fields.
		var belongs bool
		err = database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1
				FROM spp_payments p
				JOIN students s ON s.id = p.student_id
				WHERE p.id = $1 AND s.nis = $2
			)
		`, id, claims.Identifier).Scan(&belongs)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memvalidasi kepemilikan data"})
		}
		if !belongs {
			return c.JSON(http.StatusForbidden, map[string]string{"message": "Anda tidak bisa mengubah data pembayaran ini"})
		}

		_, err = database.DB.Exec(`
			UPDATE spp_payments SET
				payment_date = NULLIF($1::TEXT,'')::DATE,
				bank_name = $2::TEXT,
				account_holder = $3::TEXT,
				transaction_id = $4::TEXT,
				notes = $5::TEXT,
				status = CASE
					WHEN $4::TEXT != '' AND status = 'belum_bayar' THEN 'pending_verifikasi'::spp_payment_status
					ELSE status
				END,
				updated_at = NOW()
			WHERE id = $6
		`, req.PaymentDate, req.BankName, req.AccountHolder, req.TransactionID, req.Notes, id)
	} else {
		lateFee := int64(0)
		discount := int64(0)
		if req.LateFee != nil {
			lateFee = *req.LateFee
		}
		if req.Discount != nil {
			discount = *req.Discount
		}

		_, err = database.DB.Exec(`
			UPDATE spp_payments SET
				payment_date = NULLIF($1::TEXT,'')::DATE,
				due_date = COALESCE(NULLIF($2::TEXT,'')::DATE, due_date),
				bank_name = $3::TEXT, account_holder = $4::TEXT,
				transaction_id = $5::TEXT,
				late_fee = $6, discount = $7,
				notes = $8::TEXT,
				status = CASE
					WHEN $5::TEXT != '' AND status = 'belum_bayar' THEN 'pending_verifikasi'::spp_payment_status
					ELSE status
				END,
				updated_at = NOW()
			WHERE id = $9
		`, req.PaymentDate, req.DueDate, req.BankName, req.AccountHolder,
			req.TransactionID, lateFee, discount,
			req.Notes, id)
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui tagihan SPP: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Data tagihan SPP berhasil diperbarui"})
}

// VerifySppPayment verifies/rejects an SPP payment (admin action)
func VerifySppPayment(c echo.Context) error {
	id := c.Param("id")
	req := new(models.VerifySppRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	// Get user ID from JWT context (set by JWTMiddleware)
	userID := c.Get("user_id")
	if userID == nil {
		userID = ""
	}

	paidAt := req.PaidAt
	if paidAt == "" && req.Status == "lunas" {
		paidAt = time.Now().Format("2006-01-02T15:04:05Z")
	}

	_, err := database.DB.Exec(`
		UPDATE spp_payments SET
			status = $1::spp_payment_status,
			verified_by = NULLIF($2,'')::UUID,
			verified_at = NOW(),
			paid_at = NULLIF($3,'')::TIMESTAMPTZ,
			notes = COALESCE(NULLIF($4,''), notes),
			updated_at = NOW()
		WHERE id = $5
	`, req.Status, fmt.Sprintf("%v", userID), paidAt, req.Notes, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memverifikasi pembayaran: " + err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Status pembayaran berhasil diperbarui"})
}

// DeleteSppPayment deletes a payment record
func DeleteSppPayment(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec("DELETE FROM spp_payments WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus tagihan SPP"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Tagihan SPP berhasil dihapus"})
}

// GetSppMonthlyStats returns stats for dashboard
func GetSppMonthlyStats(c echo.Context) error {
	year := c.QueryParam("year")
	month := c.QueryParam("month")
	if year == "" {
		year = strconv.Itoa(time.Now().Year())
	}
	if month == "" {
		month = strconv.Itoa(int(time.Now().Month()))
	}

	var lunas, pending, belumBayar int
	var totalCollected int64
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	teacherID := ""
	if claims != nil && claims.Role == "guru" {
		_ = database.DB.QueryRow("SELECT id FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherID)
	}

	query := `
		SELECT
			COUNT(*) FILTER (WHERE status = 'lunas'),
			COUNT(*) FILTER (WHERE status = 'pending_verifikasi'),
			COUNT(*) FILTER (WHERE status = 'belum_bayar'),
			COALESCE(SUM(amount + late_fee - discount) FILTER (WHERE status = 'lunas'), 0)
		FROM spp_payments p
		JOIN students s ON s.id = p.student_id
		LEFT JOIN classes cl ON cl.id = s.class_id
		WHERE year = $1 AND month = $2
	`
	args := []interface{}{year, month}
	if teacherID != "" {
		query += " AND cl.homeroom_teacher_id = $3"
		args = append(args, teacherID)
	}
	database.DB.QueryRow(query, args...).Scan(&lunas, &pending, &belumBayar, &totalCollected)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"month":           month,
		"year":            year,
		"lunas":           lunas,
		"pending":         pending,
		"belum_bayar":     belumBayar,
		"total_collected": totalCollected,
	})
}
