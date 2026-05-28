package controllers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"siak/backend/database"
	"siak/backend/middlewares"
)

type DashboardStats struct {
	TotalStudents       int `json:"total_students"`
	TotalTeachers       int `json:"total_teachers"`
	TotalSPPMonth       int `json:"total_spp_month"` // Dalam Rupiah
	PendingVerification int `json:"pending_verification"`
	DisplayName         string `json:"display_name"`
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

	// 3. Get Total SPP Paid this month
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()
	
	// Gunakan COALESCE untuk mencegah NULL jika belum ada pembayaran
	sppQuery := `
		SELECT COALESCE(SUM(p.amount + p.late_fee - p.discount), 0)
		FROM spp_payments p
		JOIN students s ON s.id = p.student_id
		LEFT JOIN classes c ON c.id = s.class_id
		WHERE p.status = 'lunas' AND p.month = $1 AND p.year = $2
	`
	sppArgs := []interface{}{currentMonth, currentYear}
	if teacherID != "" {
		sppQuery += " AND c.homeroom_teacher_id = $3"
		sppArgs = append(sppArgs, teacherID)
	}
	err = database.DB.QueryRow(sppQuery, sppArgs...).Scan(&stats.TotalSPPMonth)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch SPP stats"})
	}

	// 4. Get Pending Verifications for SPP
	pendingQuery := `
		SELECT COUNT(*)
		FROM spp_payments p
		JOIN students s ON s.id = p.student_id
		LEFT JOIN classes c ON c.id = s.class_id
		WHERE p.status = 'pending_verifikasi'
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
