package models

// SppSetting adalah konfigurasi nominal SPP per tingkat kelas & tahun ajaran
type SppSetting struct {
	ID           string  `json:"id"`
	AcademicYear string  `json:"academic_year"` // cth: 2025/2026
	GradeLevel   *int    `json:"grade_level"`   // 10, 11, 12; null = semua tingkat
	ClassID      *string `json:"class_id"`      // Khusus untuk 1 kelas tertentu
	ClassName    *string `json:"class_name"`    // Untuk UI
	Amount       int64   `json:"amount"`        // Nominal SPP (Rp)
	Description  string  `json:"description"`
	IsActive     bool    `json:"is_active"`
	CreatedAt    string  `json:"created_at"`
}

// CreateSppSettingRequest untuk pembuatan setting SPP baru
type CreateSppSettingRequest struct {
	AcademicYear string  `json:"academic_year" validate:"required"`
	GradeLevel   *int    `json:"grade_level"`
	ClassID      *string `json:"class_id"`
	Amount       int64   `json:"amount" validate:"required"`
	Description  string  `json:"description"`
}

// SppPayment adalah data tagihan dan pembayaran SPP siswa
type SppPayment struct {
	ID           string `json:"id"`
	StudentID    string `json:"student_id"`
	StudentName  string `json:"student_name"`
	StudentNIS   string `json:"student_nis"`
	ClassName    string `json:"class_name"`
	SppSettingID string `json:"spp_setting_id"`
	AcademicYear string `json:"academic_year"`
	Month        int    `json:"month"`
	Year         int    `json:"year"`
	Amount       int64  `json:"amount"`
	LateFee      int64  `json:"late_fee"`
	Discount     int64  `json:"discount"`
	TotalAmount  int64  `json:"total_amount"` // Amount + LateFee - Discount
	DueDate      string `json:"due_date"`
	Status       string `json:"status"` // belum_bayar / pending_verifikasi / lunas / bebas_spp

	// Info Pembayaran
	PaymentDate     string `json:"payment_date"`
	BankName        string `json:"bank_name"`
	AccountHolder   string `json:"account_holder"`
	TransactionID   string `json:"transaction_id"`
	PaymentProofURL string `json:"payment_proof_url"`

	// Verifikasi
	VerifiedBy string `json:"verified_by"`
	VerifiedAt string `json:"verified_at"`
	PaidAt     string `json:"paid_at"`
	Notes      string `json:"notes"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// CreateSppPaymentRequest untuk buat tagihan manual
type CreateSppPaymentRequest struct {
	StudentID    string `json:"student_id" validate:"required"`
	SppSettingID string `json:"spp_setting_id"`
	AcademicYear string `json:"academic_year" validate:"required"`
	Month        int    `json:"month" validate:"required"`
	Year         int    `json:"year" validate:"required"`
	Amount       int64  `json:"amount" validate:"required"`
	LateFee      int64  `json:"late_fee"`
	Discount     int64  `json:"discount"`
	DueDate      string `json:"due_date" validate:"required"`
	Notes        string `json:"notes"`
}

// GenerateSppRequest untuk generate tagihan massal satu bulan
type GenerateSppRequest struct {
	AcademicYear string `json:"academic_year" validate:"required"`
	Month        int    `json:"month" validate:"required"`
	Year         int    `json:"year" validate:"required"`
	DueDate      string `json:"due_date" validate:"required"`
	SppSettingID string `json:"spp_setting_id"` // Jika kosong, cari setting berdasarkan grade_level siswa
}

// UpdateSppPaymentRequest untuk update data pembayaran (diisi siswa/wali)
type UpdateSppPaymentRequest struct {
	PaymentDate   string `json:"payment_date"`
	DueDate       string `json:"due_date"`
	BankName      string `json:"bank_name"`
	AccountHolder string `json:"account_holder"`
	TransactionID string `json:"transaction_id"`
	LateFee       *int64 `json:"late_fee"`
	Discount      *int64 `json:"discount"`
	Notes         string `json:"notes"`
}

// VerifySppRequest untuk verifikasi/konfirmasi pembayaran oleh admin
type VerifySppRequest struct {
	Status string `json:"status" validate:"required"` // lunas / bebas_spp / belum_bayar
	PaidAt string `json:"paid_at"`
	Notes  string `json:"notes"`
}

// SppSummary adalah ringkasan SPP siswa (total tagihan, lunas, tunggakan)
type SppSummary struct {
	StudentID    string `json:"student_id"`
	StudentName  string `json:"student_name"`
	TotalBilled  int64  `json:"total_billed"`
	TotalPaid    int64  `json:"total_paid"`
	TotalPending int64  `json:"total_pending"`
	Arrears      int64  `json:"arrears"`
	PaidCount    int    `json:"paid_count"`
	UnpaidCount  int    `json:"unpaid_count"`
}
