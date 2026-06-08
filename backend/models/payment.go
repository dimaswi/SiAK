package models

type Billing struct {
	ID          string `json:"id"`
	StudentID   string `json:"student_id"`
	StudentName string `json:"student_name"`
	StudentNIS  string `json:"student_nis"`
	Type        string `json:"type"` // SPP, UANG_GEDUNG, SERAGAM, LAINNYA
	Title       string `json:"title"`
	Description string `json:"description"`
	TotalAmount int64  `json:"total_amount"`
	PaidAmount  int64  `json:"paid_amount"`
	DueDate     string `json:"due_date"`
	Status      string `json:"status"` // belum_bayar, sebagian, lunas, dibatalkan
	HasPending  bool   `json:"has_pending"` // True if there are pending transactions
	Month       *int   `json:"month"`
	Year        *int   `json:"year"`
	CreatedBy   string `json:"created_by"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type PaymentTransaction struct {
	ID              string `json:"id"`
	BillingID       string `json:"billing_id"`
	Amount          int64  `json:"amount"`
	PaymentDate     string `json:"payment_date"`
	PaymentMethod   string `json:"payment_method"`
	BankName        string `json:"bank_name"`
	AccountHolder   string `json:"account_holder"`
	PaymentProofURL string `json:"payment_proof_url"`
	Status          string `json:"status"` // pending, terverifikasi, ditolak
	Notes           string `json:"notes"`
	VerifiedBy      string `json:"verified_by"`
	VerifiedAt      string `json:"verified_at"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type CreateBillingRequest struct {
	StudentID   string   `json:"student_id"`
	StudentIDs  []string `json:"student_ids"`
	Type        string   `json:"type" validate:"required"` // SPP, UANG_GEDUNG, dll
	Title       string   `json:"title" validate:"required"`
	Description string   `json:"description"`
	TotalAmount int64    `json:"total_amount" validate:"required"`
	DueDate     string   `json:"due_date" validate:"required"`
	Month            *int     `json:"month"`
	Year             *int     `json:"year"`
	IsInstallment    bool     `json:"is_installment"`
	InstallmentCount int      `json:"installment_count"`
}

type CreatePaymentTransactionRequest struct {
	BillingID       string `json:"billing_id" validate:"required"`
	Amount          int64  `json:"amount" validate:"required"`
	PaymentDate     string `json:"payment_date" validate:"required"`
	PaymentMethod   string `json:"payment_method"`
	BankName        string `json:"bank_name"`
	AccountHolder   string `json:"account_holder"`
	Notes           string `json:"notes"`
}

type VerifyPaymentRequest struct {
	Status string `json:"status" validate:"required"` // terverifikasi, ditolak
	Notes  string `json:"notes"`
}
