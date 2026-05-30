//go:build ignore

package main

import (
	"fmt"
	"log"
	"siak/backend/config"
	"siak/backend/database"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	defer database.Close()

	passwordHash := "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBpAt28.VD.OHG"

	fmt.Println("Seeding classes...")
	var classId1, classId2 string
	err := database.DB.QueryRow(`
		INSERT INTO classes (name, grade_level, academic_year) 
		VALUES ('X IPA 1', 10, '2025/2026') 
		ON CONFLICT DO NOTHING RETURNING id`).Scan(&classId1)
	if err != nil {
		database.DB.QueryRow(`SELECT id FROM classes WHERE name = 'X IPA 1' LIMIT 1`).Scan(&classId1)
	}

	err = database.DB.QueryRow(`
		INSERT INTO classes (name, grade_level, academic_year) 
		VALUES ('XI IPS 2', 11, '2025/2026') 
		ON CONFLICT DO NOTHING RETURNING id`).Scan(&classId2)
	if err != nil {
		database.DB.QueryRow(`SELECT id FROM classes WHERE name = 'XI IPS 2' LIMIT 1`).Scan(&classId2)
	}

	fmt.Println("Seeding teachers...")
	teachersData := []struct {
		NIP      string
		FullName string
		Gender   string
		Subject  string
	}{
		{"198001012005011001", "Budi Santoso, S.Pd", "L", "Matematika"},
		{"198202022006022002", "Siti Aminah, M.Pd", "P", "Bahasa Inggris"},
		{"198503032008031003", "Andi Irawan, S.Kom", "L", "Informatika"},
		{"198304042009042004", "Dewi Sartika, S.Pd", "P", "Biologi"},
		{"197805052003051005", "Kurniawan, S.Si", "L", "Fisika"},
	}

	for _, t := range teachersData {
		var userID string
		err := database.DB.QueryRow(`
			INSERT INTO users (identifier, password_hash, role) 
			VALUES ($1, $2, 'guru') 
			ON CONFLICT (identifier) DO UPDATE SET role='guru' RETURNING id`, t.NIP, passwordHash).Scan(&userID)
		if err != nil {
			log.Println("User insert error:", err)
			continue
		}

		_, err = database.DB.Exec(`
			INSERT INTO teachers (user_id, nip, full_name, gender, subject, employee_status, religion, education_level) 
			VALUES ($1, $2, $3, $4, $5, 'pns', 'Islam', 's1')
			ON CONFLICT (nip) DO NOTHING`, userID, t.NIP, t.FullName, t.Gender, t.Subject)
		if err != nil {
			log.Println("Teacher insert error:", err)
		}
	}

	fmt.Println("Seeding students...")
	studentNames := []string{
		"Ahmad Fauzi", "Bella Safira", "Chandra Wijaya", "Dina Lestari", "Eko Prasetyo",
		"Fajar Hidayat", "Gita Putri", "Hadi Mulyono", "Indah Permata", "Joko Supriyanto",
		"Kartika Sari", "Luki Andrian", "Mega Wulandari", "Nanda Pratama", "Okta Setiawan",
		"Putri Maharani", "Qori Nurhaliza", "Rian Saputra", "Sinta Aprilia", "Taufik Hidayat",
	}

	startNIS := 250000
	for i, name := range studentNames {
		nis := fmt.Sprintf("%d", startNIS+i+1)
		gender := "L"
		if i%2 != 0 {
			gender = "P"
		}
		
		classID := classId1
		if i >= 10 {
			classID = classId2
		}

		var userID string
		err := database.DB.QueryRow(`
			INSERT INTO users (identifier, password_hash, role) 
			VALUES ($1, $2, 'siswa') 
			ON CONFLICT (identifier) DO UPDATE SET role='siswa' RETURNING id`, nis, passwordHash).Scan(&userID)
		if err != nil {
			log.Println("User insert error:", err)
			continue
		}

		_, err = database.DB.Exec(`
			INSERT INTO students (user_id, nis, full_name, gender, class_id, religion, father_name, mother_name) 
			VALUES ($1, $2, $3, $4, $5, 'Islam', $6, $7)
			ON CONFLICT (nis) DO NOTHING`, userID, nis, name, gender, classID, "Bapak "+name, "Ibu "+name)
		if err != nil {
			log.Println("Student insert error:", err)
		}
	}

	fmt.Println("Seeding completed successfully!")
}
