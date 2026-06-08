package controllers

import (
	"fmt"
	"math"
	"net/http"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

// GetBillings fetches billings with pagination and filters
func GetBillings(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	studentID := c.QueryParam("student_id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims.Role == "siswa" || claims.Role == "wali_murid" {
		var actualStudentID string
		err := database.DB.QueryRow(`SELECT id FROM students WHERE user_id = $1`, claims.ID).Scan(&actualStudentID)
		if err == nil {
			studentID = actualStudentID
		} else {
			studentID = "invalid-student"
		}
	}
	billingType := c.QueryParam("type")
	status := c.QueryParam("status")
	search := c.QueryParam("search")

	query := `
		SELECT b.id, b.student_id, s.full_name, s.nis, b.type, b.title, b.description, 
		       b.total_amount, b.paid_amount, b.due_date, b.status, b.month, b.year, b.created_at,
		       EXISTS(SELECT 1 FROM payment_transactions pt WHERE pt.billing_id = b.id AND pt.status = 'pending') as has_pending
		FROM billings b
		JOIN students s ON b.student_id = s.id
		WHERE 1=1
	`
	args := []interface{}{}
	argId := 1

	if studentID != "" {
		query += ` AND b.student_id = $` + strconv.Itoa(argId)
		args = append(args, studentID)
		argId++
	}
	if billingType != "" {
		query += ` AND b.type = $` + strconv.Itoa(argId)
		args = append(args, billingType)
		argId++
	}
	if status != "" && status != "all" {
		if status == "perlu_verifikasi" {
			query += ` AND EXISTS(SELECT 1 FROM payment_transactions pt WHERE pt.billing_id = b.id AND pt.status = 'pending')`
		} else {
			query += ` AND b.status = $` + strconv.Itoa(argId)
			args = append(args, status)
			argId++
		}
	}
	if search != "" {
		query += ` AND (b.title ILIKE $` + strconv.Itoa(argId) + ` OR s.full_name ILIKE $` + strconv.Itoa(argId) + `)`
		args = append(args, "%"+search+"%")
		argId++
	}

	query += ` ORDER BY 
	  has_pending DESC, 
	  CASE b.status 
	    WHEN 'sebagian' THEN 1 
	    WHEN 'belum_bayar' THEN 2 
	    WHEN 'lunas' THEN 3 
	    ELSE 4 
	  END ASC, 
	  b.due_date ASC
	LIMIT $` + strconv.Itoa(argId) + ` OFFSET $` + strconv.Itoa(argId+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data tagihan: " + err.Error()})
	}
	defer rows.Close()

	var billings []models.Billing
	for rows.Next() {
		var b models.Billing
		var t time.Time
		var cAt time.Time
		var desc *string
		err := rows.Scan(&b.ID, &b.StudentID, &b.StudentName, &b.StudentNIS, &b.Type, &b.Title, &desc,
			&b.TotalAmount, &b.PaidAmount, &t, &b.Status, &b.Month, &b.Year, &cAt, &b.HasPending)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data tagihan: " + err.Error()})
		}
		if desc != nil {
			b.Description = *desc
		}
		b.DueDate = t.Format("2006-01-02")
		b.CreatedAt = cAt.Format(time.RFC3339)
		billings = append(billings, b)
	}

	// Count total for pagination
	countQuery := `SELECT COUNT(*) FROM billings b JOIN students s ON b.student_id = s.id WHERE 1=1`
	countArgs := []interface{}{}
	countArgId := 1
	if studentID != "" {
		countQuery += ` AND b.student_id = $` + strconv.Itoa(countArgId)
		countArgs = append(countArgs, studentID)
		countArgId++
	}
	if billingType != "" {
		countQuery += ` AND b.type = $` + strconv.Itoa(countArgId)
		countArgs = append(countArgs, billingType)
		countArgId++
	}
	if status != "" && status != "all" {
		if status == "perlu_verifikasi" {
			countQuery += ` AND EXISTS(SELECT 1 FROM payment_transactions pt WHERE pt.billing_id = b.id AND pt.status = 'pending')`
		} else {
			countQuery += ` AND b.status = $` + strconv.Itoa(countArgId)
			countArgs = append(countArgs, status)
			countArgId++
		}
	}
	if search != "" {
		countQuery += ` AND (b.title ILIKE $` + strconv.Itoa(countArgId) + ` OR s.full_name ILIKE $` + strconv.Itoa(countArgId) + `)`
		countArgs = append(countArgs, "%"+search+"%")
		countArgId++
	}
	var total int
	database.DB.QueryRow(countQuery, countArgs...).Scan(&total)

	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": billings,
		"meta": map[string]interface{}{
			"total_items":  total,
			"total_pages":  totalPages,
			"current_page": page,
			"limit":        limit,
		},
	})
}

// GetBillingByID fetches a single billing by its ID
func GetBillingByID(c echo.Context) error {
	id := c.Param("id")
	query := `
		SELECT b.id, b.student_id, s.full_name, s.nis, b.type, b.title, b.description, 
		       b.total_amount, b.paid_amount, b.due_date, b.status, b.month, b.year, b.created_at,
		       EXISTS(SELECT 1 FROM payment_transactions pt WHERE pt.billing_id = b.id AND pt.status = 'pending') as has_pending
		FROM billings b
		JOIN students s ON b.student_id = s.id
		WHERE b.id = $1
	`
	var b models.Billing
	var t time.Time
	var cAt time.Time
	var desc *string
	err := database.DB.QueryRow(query, id).Scan(&b.ID, &b.StudentID, &b.StudentName, &b.StudentNIS, &b.Type, &b.Title, &desc,
		&b.TotalAmount, &b.PaidAmount, &t, &b.Status, &b.Month, &b.Year, &cAt, &b.HasPending)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Tagihan tidak ditemukan"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims.Role == "siswa" || claims.Role == "wali_murid" {
		var actualStudentID string
		err := database.DB.QueryRow(`SELECT id FROM students WHERE user_id = $1`, claims.ID).Scan(&actualStudentID)
		if err != nil || b.StudentID != actualStudentID {
			return c.JSON(http.StatusForbidden, map[string]string{"message": "Akses ditolak"})
		}
	}

	if desc != nil {
		b.Description = *desc
	}
	b.DueDate = t.Format("2006-01-02")
	b.CreatedAt = cAt.Format(time.RFC3339)

	return c.JSON(http.StatusOK, b)
}

// CreateBilling creates a new billing entry
func CreateBilling(c echo.Context) error {
	var req models.CreateBillingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Input tidak valid"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := claims.ID

	query := `
		INSERT INTO billings (student_id, type, title, description, total_amount, due_date, month, year, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`

	studentIDs := req.StudentIDs
	if len(studentIDs) == 0 && req.StudentID != "" {
		studentIDs = []string{req.StudentID}
	}
	if len(studentIDs) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "student_id atau student_ids harus diisi"})
	}

	var createdIDs []string
	
	baseDueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Format due_date salah, gunakan YYYY-MM-DD"})
	}

	if req.IsInstallment && req.InstallmentCount > 1 {
		installmentAmount := int64(math.Ceil(float64(req.TotalAmount) / float64(req.InstallmentCount)))
		
		for _, studentID := range studentIDs {
			for i := 1; i <= req.InstallmentCount; i++ {
				var id string
				installmentTitle := fmt.Sprintf("%s - Cicilan %d", req.Title, i)
				
				// Calculate due date for this installment (add months)
				currentDueDate := baseDueDate.AddDate(0, i-1, 0).Format("2006-01-02")
				
				err := database.DB.QueryRow(query, studentID, req.Type, installmentTitle, req.Description, installmentAmount, currentDueDate, req.Month, req.Year, userID).Scan(&id)
				if err != nil {
					return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat cicilan: " + err.Error()})
				}
				createdIDs = append(createdIDs, id)
			}
		}
	} else {
		for _, studentID := range studentIDs {
			var id string
			err := database.DB.QueryRow(query, studentID, req.Type, req.Title, req.Description, req.TotalAmount, req.DueDate, req.Month, req.Year, userID).Scan(&id)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat tagihan: " + err.Error()})
			}
			createdIDs = append(createdIDs, id)
		}
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"message": "Tagihan berhasil dibuat", "ids": createdIDs})
}

// GetTransactions fetches all transactions for a billing
func GetTransactions(c echo.Context) error {
	billingID := c.QueryParam("billing_id")
	if billingID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "billing_id diperlukan"})
	}

	query := `
		SELECT id, billing_id, amount, payment_date, payment_method, bank_name, account_holder, payment_proof_url, status, notes, verified_by, verified_at, created_at
		FROM payment_transactions
		WHERE billing_id = $1
		ORDER BY created_at DESC
	`
	rows, err := database.DB.Query(query, billingID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data transaksi: " + err.Error()})
	}
	defer rows.Close()

	var transactions []models.PaymentTransaction
	for rows.Next() {
		var t models.PaymentTransaction
		var pDate time.Time
		var cAt time.Time
		var vAt *time.Time
		var pMethod, bName, accHolder, proofURL, notes, vBy *string

		err := rows.Scan(&t.ID, &t.BillingID, &t.Amount, &pDate, &pMethod, &bName, &accHolder, &proofURL, &t.Status, &notes, &vBy, &vAt, &cAt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data transaksi: " + err.Error()})
		}
		t.PaymentDate = pDate.Format("2006-01-02")
		t.CreatedAt = cAt.Format(time.RFC3339)
		if vAt != nil {
			t.VerifiedAt = vAt.Format(time.RFC3339)
		}
		if pMethod != nil {
			t.PaymentMethod = *pMethod
		}
		if bName != nil {
			t.BankName = *bName
		}
		if accHolder != nil {
			t.AccountHolder = *accHolder
		}
		if proofURL != nil {
			t.PaymentProofURL = *proofURL
		}
		if notes != nil {
			t.Notes = *notes
		}
		if vBy != nil {
			t.VerifiedBy = *vBy
		}
		transactions = append(transactions, t)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"data": transactions})
}

// CreateTransaction creates a payment/installment
func CreateTransaction(c echo.Context) error {
	var req models.CreatePaymentTransactionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Input tidak valid"})
	}

	query := `
		INSERT INTO payment_transactions (billing_id, amount, payment_date, payment_method, bank_name, account_holder, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	var id string
	err := database.DB.QueryRow(query, req.BillingID, req.Amount, req.PaymentDate, req.PaymentMethod, req.BankName, req.AccountHolder, req.Notes).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal merekam transaksi: " + err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]string{"message": "Transaksi berhasil dibuat", "id": id})
}

// VerifyTransaction updates status of a transaction
func VerifyTransaction(c echo.Context) error {
	id := c.Param("id")
	var req models.VerifyPaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Input tidak valid"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := claims.ID

	query := `
		UPDATE payment_transactions
		SET status = $1, notes = $2, verified_by = $3, verified_at = NOW(), updated_at = NOW()
		WHERE id = $4
	`
	_, err := database.DB.Exec(query, req.Status, req.Notes, userID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memverifikasi transaksi: " + err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Transaksi berhasil diverifikasi"})
}

// DeleteBilling removes a billing
func DeleteBilling(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec(`DELETE FROM billings WHERE id = $1`, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus tagihan"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Tagihan berhasil dihapus"})
}

// DeleteTransaction removes a transaction
func DeleteTransaction(c echo.Context) error {
	id := c.Param("id")
	
	var billingID, status string
	var amount int64
	err := database.DB.QueryRow(`SELECT billing_id, amount, status FROM payment_transactions WHERE id = $1`, id).Scan(&billingID, &amount, &status)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Transaksi tidak ditemukan"})
	}

	_, err = database.DB.Exec(`DELETE FROM payment_transactions WHERE id = $1`, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus transaksi"})
	}

	// Update billing if it was verified
	if status == "terverifikasi" {
		_, _ = database.DB.Exec(`
			UPDATE billings 
			SET paid_amount = paid_amount - $1,
			    status = CASE 
			        WHEN paid_amount - $1 <= 0 THEN 'belum_bayar'::billing_status
			        ELSE 'sebagian'::billing_status
			    END,
			    updated_at = NOW()
			WHERE id = $2
		`, amount, billingID)
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Transaksi berhasil dihapus"})
}

// PayOffBilling marks a billing as fully paid
func PayOffBilling(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	
	// 1. Get remaining amount
	var total, paid int64
	err := database.DB.QueryRow(`SELECT total_amount, paid_amount FROM billings WHERE id = $1`, id).Scan(&total, &paid)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Tagihan tidak ditemukan"})
	}
	
	sisa := total - paid
	if sisa <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Tagihan sudah lunas"})
	}
	
	// 2. Insert pending transaction
	var txID string
	err = database.DB.QueryRow(`
		INSERT INTO payment_transactions (billing_id, amount, payment_date, payment_method, notes)
		VALUES ($1, $2, NOW(), 'Pelunasan Otomatis', 'Pelunasan manual oleh admin')
		RETURNING id
	`, id, sisa).Scan(&txID)
	
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat transaksi pelunasan"})
	}
	
	// 3. Update to terverifikasi to trigger the billing status update
	_, err = database.DB.Exec(`
		UPDATE payment_transactions
		SET status = 'terverifikasi', verified_by = $1, verified_at = NOW(), updated_at = NOW()
		WHERE id = $2
	`, claims.ID, txID)
	
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memverifikasi transaksi pelunasan"})
	}
	
	return c.JSON(http.StatusOK, map[string]string{"message": "Tagihan berhasil dilunaskan"})
}

// DiscountBilling applies a discount by creating a special transaction
func DiscountBilling(c echo.Context) error {
	id := c.Param("id")
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)

	var req struct {
		Discount int64 `json:"discount" validate:"required"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Input tidak valid"})
	}
	
	var txID string
	err := database.DB.QueryRow(`
		INSERT INTO payment_transactions (billing_id, amount, payment_date, payment_method, notes)
		VALUES ($1, $2, NOW(), 'Potongan / Diskon', 'Potongan diberikan oleh admin')
		RETURNING id
	`, id, req.Discount).Scan(&txID)
	
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal merekam potongan"})
	}
	
	// Update to terverifikasi
	_, err = database.DB.Exec(`
		UPDATE payment_transactions
		SET status = 'terverifikasi', verified_by = $1, verified_at = NOW(), updated_at = NOW()
		WHERE id = $2
	`, claims.ID, txID)
	
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memverifikasi potongan"})
	}
	
	return c.JSON(http.StatusOK, map[string]string{"message": "Potongan berhasil direkam ke Riwayat Pembayaran"})
}
