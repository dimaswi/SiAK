package main

import (
	"log"
	"net/http"

	"siak/backend/config"
	"siak/backend/cron"
	"siak/backend/database"
	"siak/backend/routes"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	database.Connect(cfg)
	defer database.Close()

	// Start Background Tasks
	cron.StartBillingCron()

	// Initialize Echo
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: cfg.AllowedOrigins,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	// Setup Routes
	routes.SetupRoutes(e)

	log.Printf("🚀 Server starting on port %s", cfg.ServerPort)
	e.Logger.Fatal(e.Start(":" + cfg.ServerPort))
}
