package main

import (
	"log"
	"os"

	"siak/backend/config"
	"siak/backend/database"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	defer database.Close()

	sqlBytes, err := os.ReadFile("db/migrations/008_add_custom_stats.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	_, err = database.DB.Exec(string(sqlBytes))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	log.Println("Migration 008_add_custom_stats.sql applied successfully!")
}
