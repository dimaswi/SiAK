package database

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/lib/pq"
	"siak/backend/config"
)

var DB *sql.DB

func Connect(cfg *config.Config) {
	var err error
	DB, err = sql.Open("postgres", cfg.DatabaseDSN())
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}

	// Connection pool settings
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(10)
	DB.SetConnMaxLifetime(5 * time.Minute)

	// Verify connection
	if err = DB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("✅ Database connected successfully")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
