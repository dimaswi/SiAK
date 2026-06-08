package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	db, err := sql.Open("postgres", "postgres://postgres:Dimasw1950@localhost:5432/siak_db?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()


	_, err = db.Exec("ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'manual'")
	if err != nil {
		log.Println("Note:", err)
	}

	_, err = db.Exec(`
		DROP TABLE IF EXISTS spp_payments CASCADE;
		DROP TABLE IF EXISTS spp_billing CASCADE;
		DROP TABLE IF EXISTS spp_settings CASCADE;
	`)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Old SPP tables dropped successfully!")
}
