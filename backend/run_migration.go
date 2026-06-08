//go:build ignore

package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"siak/backend/config"
	"siak/backend/database"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	defer database.Close()

	sqlBytes, err := ioutil.ReadFile("db/migrations/012_recurring_billings.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	_, err = database.DB.Exec(string(sqlBytes))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("Migration 012 executed successfully!")
}
