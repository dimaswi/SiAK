package models

type RecurringBilling struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Amount      int64  `json:"amount"`
	TargetType  string   `json:"target_type"` // 'all', 'class', or 'manual'
	ClassID     string   `json:"class_id,omitempty"`
	StudentIDs  []string `json:"student_ids,omitempty"`
	DueDateDay  int      `json:"due_date_day"`
	IsActive    bool   `json:"is_active"`
	CreatedBy   string `json:"created_by"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type CreateRecurringBillingRequest struct {
	Type        string `json:"type" validate:"required"`
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	Amount      int64  `json:"amount" validate:"required"`
	TargetType  string   `json:"target_type" validate:"required"` // 'all', 'class', or 'manual'
	ClassID     string   `json:"class_id"`
	StudentIDs  []string `json:"student_ids"`
	DueDateDay  int      `json:"due_date_day" validate:"required,min=1,max=31"`
}
