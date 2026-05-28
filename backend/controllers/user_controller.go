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

// GetUsers lists users with pagination and search
func GetUsers(c echo.Context) error {
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
		SELECT COUNT(*) FROM users u
		WHERE u.identifier ILIKE $1
	`, search).Scan(&totalItems)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to count users"})
	}

	query := `
		SELECT 
			u.id, u.identifier, u.role::VARCHAR, u.is_active, u.must_change_password
		FROM users u
		WHERE u.identifier ILIKE $1
		ORDER BY u.created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := database.DB.Query(query, search, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to fetch users: " + err.Error()})
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Identifier, &u.Role, &u.IsActive, &u.MustChangePassword); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to parse user data"})
		}
		users = append(users, u)
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": users,
		"meta": PaginationMeta{
			TotalItems:  totalItems,
			TotalPages:  totalPages,
			CurrentPage: page,
			Limit:       limit,
		},
	})
}

// UpdateUserRole updates an existing user's role
func UpdateUserRole(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdateRoleRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	
	if req.Role == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Role tidak boleh kosong"})
	}

	// Verify the role is valid (enum in database: 'admin', 'kepala_sekolah', 'guru', 'siswa', 'wali_murid')
	validRoles := map[string]bool{
		"admin":          true,
		"kepala_sekolah": true,
		"guru":           true,
		"siswa":          true,
		"wali_murid":     true,
	}

	if !validRoles[req.Role] {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Role tidak valid"})
	}

	_, err := database.DB.Exec(`
		UPDATE users SET
			role = $1::user_role,
			updated_at = NOW()
		WHERE id = $2
	`, req.Role, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui hak akses pengguna: " + err.Error()})
	}
	
	return c.JSON(http.StatusOK, map[string]string{"message": "Hak akses pengguna berhasil diperbarui"})
}

// UpdateUserStatus updates an existing user's active status
func UpdateUserStatus(c echo.Context) error {
	id := c.Param("id")
	req := struct {
		IsActive bool `json:"is_active"`
	}{}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	_, err := database.DB.Exec(`
		UPDATE users SET
			is_active = $1,
			updated_at = NOW()
		WHERE id = $2
	`, req.IsActive, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui status pengguna: " + err.Error()})
	}
	
	return c.JSON(http.StatusOK, map[string]string{"message": "Status pengguna berhasil diperbarui"})
}

// UpdateUserPassword updates an existing user's password
func UpdateUserPassword(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpdatePasswordRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	if len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Password minimal 6 karakter"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to process password"})
	}

	_, err = database.DB.Exec(`
		UPDATE users SET
			password_hash = $1,
			must_change_password = false,
			updated_at = NOW()
		WHERE id = $2
	`, string(hashedPassword), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui password pengguna: " + err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Password pengguna berhasil diperbarui"})
}
