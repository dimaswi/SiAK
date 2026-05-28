package middlewares

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"siak/backend/config"
	"siak/backend/models"
)

type JwtCustomClaims struct {
	ID         string `json:"id"`
	Identifier string `json:"identifier"`
	Role       string `json:"role"`
	jwt.RegisteredClaims
}

// RequireRoles allows only specific roles to access a route
func RequireRoles(roles ...string) echo.MiddlewareFunc {
	allowed := map[string]bool{}
	for _, role := range roles {
		allowed[role] = true
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, ok := c.Get("user").(*JwtCustomClaims)
			if !ok || user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if !allowed[user.Role] {
				return c.JSON(http.StatusForbidden, map[string]string{"message": "Akses ditolak untuk role ini"})
			}

			return next(c)
		}
	}
}

// GenerateToken generates a JWT token for a given user
func GenerateToken(user models.User, secret string) (string, error) {
	claims := &JwtCustomClaims{
		user.ID,
		user.Identifier,
		user.Role,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 72)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// JWTMiddleware validates the JWT token
func JWTMiddleware() echo.MiddlewareFunc {
	cfg := config.Load()

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Missing authorization header"})
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid authorization format"})
			}

			tokenString := parts[1]

			token, err := jwt.ParseWithClaims(tokenString, &JwtCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(cfg.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid or expired token"})
			}

			if claims, ok := token.Claims.(*JwtCustomClaims); ok && token.Valid {
				c.Set("user", claims)
				return next(c)
			}

			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid claims"})
		}
	}
}
