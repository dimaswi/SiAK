package cron

import (
	"log"
	"siak/backend/database"
	"time"
)

// StartBillingCron runs the cron job to check and generate recurring billings
func StartBillingCron() {
	// Run initially on startup
	go func() {
		processRecurringBillings()
		
		// Then run every 24 hours
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			processRecurringBillings()
		}
	}()
}

func processRecurringBillings() {
	now := time.Now()
	todayDay := now.Day()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	log.Printf("[CRON] Checking recurring billings for Day %d, Month %d, Year %d...", todayDay, currentMonth, currentYear)

	// Fetch active rules that match today's day
	query := `
		SELECT id 
		FROM recurring_billings 
		WHERE is_active = true AND due_date_day = $1
	`
	rows, err := database.DB.Query(query, todayDay)
	if err != nil {
		log.Printf("[CRON] Error fetching recurring billings: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var ruleID string
		if err := rows.Scan(&ruleID); err != nil {
			log.Printf("[CRON] Error scanning rule: %v", err)
			continue
		}
		_, err := ProcessSingleRecurringBilling(ruleID, currentMonth, currentYear)
		if err != nil {
			log.Printf("[CRON] Failed to process rule %s: %v", ruleID, err)
		}
	}
}

// ProcessSingleRecurringBilling processes a single recurring billing rule for a specific month and year
func ProcessSingleRecurringBilling(ruleID string, currentMonth int, currentYear int) (int, error) {
	var (
		rType      string
		rTitle     string
		rDesc      *string
		rAmount    int64
		targetType string
		classID    *string
		createdBy  *string
	)

	err := database.DB.QueryRow(`
		SELECT type, title, description, amount, target_type, class_id, created_by 
		FROM recurring_billings 
		WHERE id = $1
	`, ruleID).Scan(&rType, &rTitle, &rDesc, &rAmount, &targetType, &classID, &createdBy)
	if err != nil {
		return 0, err
	}

	// Check if already generated for this month
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM recurring_billing_logs WHERE recurring_billing_id = $1 AND month = $2 AND year = $3)", ruleID, currentMonth, currentYear).Scan(&exists)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, nil // Already processed
	}

	// Generate billings
	studentIDs := []string{}
	if targetType == "all" {
		sRows, _ := database.DB.Query("SELECT id FROM students WHERE is_active = true")
		for sRows.Next() {
			var id string
			sRows.Scan(&id)
			studentIDs = append(studentIDs, id)
		}
		sRows.Close()
	} else if targetType == "class" && classID != nil {
		sRows, _ := database.DB.Query("SELECT id FROM students WHERE class_id = $1 AND is_active = true", *classID)
		for sRows.Next() {
			var id string
			sRows.Scan(&id)
			studentIDs = append(studentIDs, id)
		}
		sRows.Close()
	} else if targetType == "manual" {
		sRows, _ := database.DB.Query("SELECT student_id FROM recurring_billing_students WHERE recurring_billing_id = $1", ruleID)
		for sRows.Next() {
			var id string
			sRows.Scan(&id)
			studentIDs = append(studentIDs, id)
		}
		sRows.Close()
	}

	successCount := 0
	dueDateStr := time.Now().Format("2006-01-02")
	for _, sID := range studentIDs {
		_, err := database.DB.Exec(`
			INSERT INTO billings (student_id, type, title, description, total_amount, due_date, month, year, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, sID, rType, rTitle, rDesc, rAmount, dueDateStr, currentMonth, currentYear, createdBy)
		if err == nil {
			successCount++
		}
	}

	if successCount > 0 {
		// Log the execution
		_, err = database.DB.Exec("INSERT INTO recurring_billing_logs (recurring_billing_id, month, year) VALUES ($1, $2, $3)", ruleID, currentMonth, currentYear)
		if err != nil {
			log.Printf("[CRON] Error writing log for rule %s: %v", ruleID, err)
		}
	}

	log.Printf("[CRON] Generated %d billings for rule %s (%s)", successCount, ruleID, rTitle)
	return successCount, nil
}
