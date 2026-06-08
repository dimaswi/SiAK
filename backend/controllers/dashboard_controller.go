package controllers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"siak/backend/database"
	"siak/backend/middlewares"
)

type DashboardStats struct {
	TotalStudents       int    `json:"total_students"`
	TotalTeachers       int    `json:"total_teachers"`
	TotalPaymentsMonth  int    `json:"total_payments_month"` // Dalam Rupiah
	PendingVerification int    `json:"pending_verification"`
	DisplayName         string `json:"display_name"`
	StudentTotalBillings int `json:"student_total_billings,omitempty"`
	StudentTotalPaid     int `json:"student_total_paid,omitempty"`
	StudentTotalUnpaid   int `json:"student_total_unpaid,omitempty"`
}

func GetDashboardStats(c echo.Context) error {
	stats := DashboardStats{}
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	if claims != nil {
		stats.DisplayName = claims.Identifier
		if claims.Role != "admin" {
			var teacherName string
			if err := database.DB.QueryRow("SELECT full_name FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherName); err == nil && teacherName != "" {
				stats.DisplayName = teacherName
			}
		}
	}

	teacherID := ""
	if claims != nil && claims.Role == "guru" {
		_ = database.DB.QueryRow("SELECT id FROM teachers WHERE nip = $1", claims.Identifier).Scan(&teacherID)
	}

	if claims != nil && (claims.Role == "siswa" || claims.Role == "wali_murid") {
		var actualStudentID string
		err := database.DB.QueryRow(`SELECT id FROM students WHERE user_id = $1`, claims.ID).Scan(&actualStudentID)
		if err == nil {
			errSum := database.DB.QueryRow(`SELECT COALESCE(SUM(total_amount), 0)::BIGINT, COALESCE(SUM(paid_amount), 0)::BIGINT FROM billings WHERE student_id = $1 AND status != 'dibatalkan'`, actualStudentID).Scan(&stats.StudentTotalBillings, &stats.StudentTotalPaid)
			if errSum != nil {
				// Fallback or log if needed
			}
			stats.StudentTotalUnpaid = stats.StudentTotalBillings - stats.StudentTotalPaid

			database.DB.QueryRow(`
				SELECT COUNT(*)::INT 
				FROM payment_transactions t 
				JOIN billings b ON b.id = t.billing_id 
				WHERE b.student_id = $1 AND t.status = 'pending'`, actualStudentID).Scan(&stats.PendingVerification)
		}
		return c.JSON(http.StatusOK, stats)
	}

	// 1. Get Total Active Students
	studentQuery := "SELECT COUNT(*) FROM students WHERE is_active = true"
	studentArgs := []interface{}{}
	if teacherID != "" {
		studentQuery += " AND class_id IN (SELECT id FROM classes WHERE homeroom_teacher_id = $1)"
		studentArgs = append(studentArgs, teacherID)
	}
	err := database.DB.QueryRow(studentQuery, studentArgs...).Scan(&stats.TotalStudents)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch student stats"})
	}

	// 2. Get Total Active Teachers
	err = database.DB.QueryRow("SELECT COUNT(*) FROM teachers WHERE is_active = true").Scan(&stats.TotalTeachers)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch teacher stats"})
	}

	// 3. Get Total Payments Paid this month
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	// Gunakan COALESCE untuk mencegah NULL jika belum ada pembayaran
	sppQuery := `
		SELECT COALESCE(SUM(t.amount), 0)
		FROM payment_transactions t
		JOIN billings b ON b.id = t.billing_id
		JOIN students s ON s.id = b.student_id
		LEFT JOIN classes c ON c.id = s.class_id
		WHERE t.status = 'terverifikasi' 
		  AND t.payment_method != 'Potongan / Diskon'
		  AND EXTRACT(MONTH FROM t.payment_date) = $1 
		  AND EXTRACT(YEAR FROM t.payment_date) = $2
	`
	sppArgs := []interface{}{currentMonth, currentYear}
	if teacherID != "" {
		sppQuery += " AND c.homeroom_teacher_id = $3"
		sppArgs = append(sppArgs, teacherID)
	}
	err = database.DB.QueryRow(sppQuery, sppArgs...).Scan(&stats.TotalPaymentsMonth)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch payment stats"})
	}

	// 4. Get Pending Verifications for Payments
	pendingQuery := `
		SELECT COUNT(*)
		FROM payment_transactions t
		JOIN billings b ON b.id = t.billing_id
		JOIN students s ON s.id = b.student_id
		LEFT JOIN classes c ON c.id = s.class_id
		WHERE t.status = 'pending'
	`
	pendingArgs := []interface{}{}
	if teacherID != "" {
		pendingQuery += " AND c.homeroom_teacher_id = $1"
		pendingArgs = append(pendingArgs, teacherID)
	}
	err = database.DB.QueryRow(pendingQuery, pendingArgs...).Scan(&stats.PendingVerification)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch pending verification stats"})
	}

	return c.JSON(http.StatusOK, stats)
}
