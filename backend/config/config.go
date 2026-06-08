package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	ServerPort string
	JWTSecret  string
	FrontendURL string
	AllowedOrigins []string
}

func Load() *Config {
	if err := godotenv.Load(".env", "../.env"); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	frontendURL := getEnv("FRONTEND_URL", "http://localhost:5173")
	allowedOrigins := parseCSV(getEnv("ALLOWED_ORIGINS", frontendURL))

	return &Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		DBHost:     getEnv("DB_HOST", "127.0.0.1"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "siak_user"),
		DBPassword: getEnv("DB_PASSWORD", "siak_password"),
		DBName:     getEnv("DB_NAME", "siak_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		ServerPort: getEnv("APP_PORT", getEnv("SERVER_PORT", "8080")),
		JWTSecret:  getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
		FrontendURL: frontendURL,
		AllowedOrigins: allowedOrigins,
	}
}

func (c *Config) DatabaseDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}

func parseCSV(value string) []string {
	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		origins = append(origins, trimmed)
	}

	return origins
}
