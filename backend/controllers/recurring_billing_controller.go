package controllers

import (
	"net/http"
	"siak/backend/cron"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"

	"github.com/labstack/echo/v4"
)

// GetRecurringBillings fetches all recurring billings
func GetRecurringBillings(c echo.Context) error {
	query := `
		SELECT id, type, title, description, amount, target_type, 
		       COALESCE(class_id::VARCHAR, ''), due_date_day, is_active, 
		       COALESCE(created_by::VARCHAR, ''), 
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM recurring_billings
		ORDER BY created_at DESC
	`
	rows, err := database.DB.Query(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil data tagihan rutin: " + err.Error()})
	}
	defer rows.Close()

	var billings []models.RecurringBilling
	for rows.Next() {
		var b models.RecurringBilling
		var desc *string
		err := rows.Scan(&b.ID, &b.Type, &b.Title, &desc, &b.Amount, &b.TargetType, &b.ClassID, &b.DueDateDay, &b.IsActive, &b.CreatedBy, &b.CreatedAt, &b.UpdatedAt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memproses data"})
		}
		if desc != nil {
			b.Description = *desc
		}
		billings = append(billings, b)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": billings,
	})
}

// CreateRecurringBilling creates a new recurring billing rule
func CreateRecurringBilling(c echo.Context) error {
	var req models.CreateRecurringBillingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Input tidak valid"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := claims.ID

	query := `
		INSERT INTO recurring_billings (type, title, description, amount, target_type, class_id, due_date_day, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	var classID interface{}
	if req.TargetType == "class" && req.ClassID != "" {
		classID = req.ClassID
	}

	var id string
	err := database.DB.QueryRow(query, req.Type, req.Title, req.Description, req.Amount, req.TargetType, classID, req.DueDateDay, userID).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat tagihan rutin: " + err.Error()})
	}

	if req.TargetType == "manual" && len(req.StudentIDs) > 0 {
		for _, studentID := range req.StudentIDs {
			_, err = database.DB.Exec("INSERT INTO recurring_billing_students (recurring_billing_id, student_id) VALUES ($1, $2)", id, studentID)
			if err != nil {
				// We don't rollback the whole billing, just log error
				continue
			}
		}
	}

	return c.JSON(http.StatusCreated, map[string]string{"message": "Tagihan rutin berhasil dibuat", "id": id})
}

// ToggleRecurringBilling activates or deactivates a rule
func ToggleRecurringBilling(c echo.Context) error {
	id := c.Param("id")
	
	var isActive bool
	err := database.DB.QueryRow("UPDATE recurring_billings SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active", id).Scan(&isActive)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengubah status"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"message": "Status berhasil diubah", "is_active": isActive})
}

// DeleteRecurringBilling deletes a recurring billing rule
func DeleteRecurringBilling(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec("DELETE FROM recurring_billings WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus tagihan rutin"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Tagihan rutin berhasil dihapus"})
}
// ForceRunRecurringBilling forces a rule to generate bills for a specific month and year
func ForceRunRecurringBilling(c echo.Context) error {
	id := c.Param("id")
	
	type ForceRunRequest struct {
		Month int `json:"month" validate:"required"`
		Year  int `json:"year" validate:"required"`
	}

	var req ForceRunRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Input tidak valid"})
	}

	successCount, err := cron.ProcessSingleRecurringBilling(id, req.Month, req.Year)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menjalankan aturan: " + err.Error()})
	}

	if successCount == 0 {
		return c.JSON(http.StatusOK, map[string]string{"message": "Tidak ada tagihan yang dibuat. Mungkin tagihan untuk bulan tersebut sudah pernah dibuat sebelumnya atau tidak ada siswa yang memenuhi kriteria."})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Berhasil menjalankan aturan",
		"generated_count": successCount,
	})
}
