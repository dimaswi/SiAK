package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"siak/backend/database"
)

const uploadDir = "./uploads"

// UploadPhoto handles photo uploads for teachers and students
// POST /api/upload/photo?entity_type=teacher&entity_id=<uuid>
func UploadPhoto(c echo.Context) error {
	entityType := c.QueryParam("entity_type") // "teacher" or "student"
	entityID := c.QueryParam("entity_id")

	if entityType == "" || entityID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "entity_type dan entity_id wajib diisi"})
	}
	if entityType != "teacher" && entityType != "student" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "entity_type harus 'teacher' atau 'student'"})
	}

	file, err := c.FormFile("photo")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "File foto tidak ditemukan dalam request"})
	}

	// Validate file type
	allowedTypes := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedTypes[ext] {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP"})
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Ukuran file maksimal 5MB"})
	}

	// Create upload directory
	entityDir := filepath.Join(uploadDir, entityType+"s")
	if err := os.MkdirAll(entityDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat direktori upload"})
	}

	// Generate unique filename
	storedName := fmt.Sprintf("%s_%s%s", entityID, uuid.New().String()[:8], ext)
	filePath := filepath.Join(entityDir, storedName)
	publicURL := fmt.Sprintf("/uploads/%ss/%s", entityType, storedName)

	// Save file
	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuka file"})
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan file"})
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menulis file"})
	}

	// Get user from JWT context
	userID := fmt.Sprintf("%v", c.Get("user_id"))

	// Record in DB
	_, err = database.DB.Exec(`
		INSERT INTO uploaded_files (file_name, stored_name, file_path, file_type, file_size, entity_type, entity_id, uploaded_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7::UUID, NULLIF($8,'')::UUID)
	`, file.Filename, storedName, publicURL, file.Header.Get("Content-Type"), file.Size,
		entityType, entityID, userID)
	if err != nil {
		// Non-fatal: file uploaded but not recorded
		fmt.Printf("Warning: failed to record upload in DB: %v\n", err)
	}

	// Update photo_url on the entity
	var updateErr error
	switch entityType {
	case "teacher":
		_, updateErr = database.DB.Exec("UPDATE teachers SET photo_url=$1, updated_at=NOW() WHERE id=$2", publicURL, entityID)
	case "student":
		_, updateErr = database.DB.Exec("UPDATE students SET photo_url=$1, updated_at=NOW() WHERE id=$2", publicURL, entityID)
	}
	if updateErr != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "File tersimpan tapi gagal mengupdate profil: " + updateErr.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":   "Foto berhasil diupload",
		"photo_url": publicURL,
		"file_name": file.Filename,
		"file_size": file.Size,
		"uploaded_at": time.Now().Format(time.RFC3339),
	})
}

// UploadPaymentProof uploads payment proof for SPP
// POST /api/upload/payment-proof?payment_id=<uuid>
func UploadPaymentProof(c echo.Context) error {
	paymentID := c.QueryParam("payment_id")
	if paymentID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "payment_id wajib diisi"})
	}

	file, err := c.FormFile("proof")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "File bukti bayar tidak ditemukan"})
	}

	allowedTypes := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".pdf": true,
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedTypes[ext] {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF"})
	}
	if file.Size > 10*1024*1024 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Ukuran file maksimal 10MB"})
	}

	proofDir := filepath.Join(uploadDir, "payment_proofs")
	if err := os.MkdirAll(proofDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuat direktori"})
	}

	storedName := fmt.Sprintf("%s_%s%s", paymentID, uuid.New().String()[:8], ext)
	filePath := filepath.Join(proofDir, storedName)
	publicURL := fmt.Sprintf("/uploads/payment_proofs/%s", storedName)

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membuka file"})
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan file"})
	}
	defer dst.Close()
	io.Copy(dst, src)

	// Update payment record
	_, err = database.DB.Exec(`
		UPDATE spp_payments SET
			payment_proof_url = $1,
			status = CASE WHEN status = 'belum_bayar' THEN 'pending_verifikasi'::spp_payment_status ELSE status END,
			updated_at = NOW()
		WHERE id = $2
	`, publicURL, paymentID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengupdate bukti pembayaran"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":         "Bukti pembayaran berhasil diupload",
		"payment_proof_url": publicURL,
	})
}
