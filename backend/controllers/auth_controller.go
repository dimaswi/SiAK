package controllers

import (
	"database/sql"
	"net/http"

	"siak/backend/config"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

func Login(c echo.Context) error {
	req := new(models.LoginRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	if req.Identifier == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Identifier and password are required"})
	}

	var user models.User
	var passwordHash string

	// Query user from database
	err := database.DB.QueryRow(`
		SELECT id, identifier, password_hash, role, is_active, must_change_password 
		FROM users 
		WHERE identifier = $1`, req.Identifier).
		Scan(&user.ID, &user.Identifier, &passwordHash, &user.Role, &user.IsActive, &user.MustChangePassword)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "User tidak terdaftar!"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Database error"})
	}

	if !user.IsActive {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Akun tidak aktif!"})
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Password salah!"})
	}

	// Generate JWT
	cfg := config.Load()
	token, err := middlewares.GenerateToken(user, cfg.JWTSecret)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal generate token"})
	}

	return c.JSON(http.StatusOK, models.LoginResponse{
		Token: token,
		User:  user,
	})
}
