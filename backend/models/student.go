package models

// Student adalah data lengkap siswa sesuai standar Dapodik
type Student struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`

	// Identitas Utama
	NIS      string `json:"nis"`
	NISN     string `json:"nisn"`
	FullName string `json:"full_name"`
	Gender   string `json:"gender"` // 'L' or 'P'
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Religion   string `json:"religion"`
	Nationality string `json:"nationality"`

	// Identitas Dokumen
	BirthCertificateNo string `json:"birth_certificate_no"`
	KKNumber           string `json:"kk_number"`

	// Data Program Bantuan
	PIPNumber string `json:"pip_number"`
	PIPReason string `json:"pip_reason"`

	// Data Sosial
	ChildOrder    int    `json:"child_order"`
	NumSiblings   int    `json:"num_siblings"`
	LivingWith    string `json:"living_with"`
	Transportation string `json:"transportation"`
	SpecialNeeds   string `json:"special_needs"`

	// Alamat
	Address    string `json:"address"`
	RtRw       string `json:"rt_rw"`
	Village    string `json:"village"`
	District   string `json:"district"`
	City       string `json:"city"`
	Province   string `json:"province"`
	PostalCode string `json:"postal_code"`

	// Kontak Siswa
	Phone string `json:"phone"`

	// Kelas
	ClassID string `json:"class_id"`

	// Data Ayah Kandung
	FatherName       string `json:"father_name"`
	FatherNIK        string `json:"father_nik"`
	FatherBirthYear  int    `json:"father_birth_year"`
	FatherEducation  string `json:"father_education"`
	FatherOccupation string `json:"father_occupation"`
	FatherIncome     int64  `json:"father_income"`
	FatherIsAlive    bool   `json:"father_is_alive"`

	// Data Ibu Kandung
	MotherName       string `json:"mother_name"`
	MotherNIK        string `json:"mother_nik"`
	MotherBirthYear  int    `json:"mother_birth_year"`
	MotherEducation  string `json:"mother_education"`
	MotherOccupation string `json:"mother_occupation"`
	MotherIncome     int64  `json:"mother_income"`
	MotherIsAlive    bool   `json:"mother_is_alive"`

	// Kontak Utama Orang Tua (untuk komunikasi darurat)
	ParentName  string `json:"parent_name"`  // deprecated -> gunakan father/mother name
	ParentPhone string `json:"parent_phone"`

	// Data Wali (jika bukan orang tua kandung)
	GuardianName       string `json:"guardian_name"`
	GuardianNIK        string `json:"guardian_nik"`
	GuardianPhone      string `json:"guardian_phone"`
	GuardianOccupation string `json:"guardian_occupation"`
	GuardianRelation   string `json:"guardian_relation"`

	// Status Akademik
	EnrollmentDate string `json:"enrollment_date"`
	ExitType       string `json:"exit_type"`
	ExitDate       string `json:"exit_date"`
	ExitReason     string `json:"exit_reason"`

	// Meta
	PhotoURL string `json:"photo_url"`
	IsActive bool   `json:"is_active"`
}

// CreateStudentRequest untuk pendaftaran siswa baru
type CreateStudentRequest struct {
	// Akun
	NIS      string `json:"nis" validate:"required"`
	Password string `json:"password" validate:"required"`

	// Identitas Utama
	NISN       string `json:"nisn"`
	FullName   string `json:"full_name" validate:"required"`
	Gender     string `json:"gender" validate:"required"`
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Religion   string `json:"religion"`
	Nationality string `json:"nationality"`

	// Identitas Dokumen
	BirthCertificateNo string `json:"birth_certificate_no"`
	KKNumber           string `json:"kk_number"`

	// Data Program Bantuan
	PIPNumber string `json:"pip_number"`
	PIPReason string `json:"pip_reason"`

	// Data Sosial
	ChildOrder     int    `json:"child_order"`
	NumSiblings    int    `json:"num_siblings"`
	LivingWith     string `json:"living_with"`
	Transportation string `json:"transportation"`
	SpecialNeeds   string `json:"special_needs"`

	// Alamat
	Address    string `json:"address"`
	RtRw       string `json:"rt_rw"`
	Village    string `json:"village"`
	District   string `json:"district"`
	City       string `json:"city"`
	Province   string `json:"province"`
	PostalCode string `json:"postal_code"`

	// Kontak Siswa
	Phone string `json:"phone"`

	// Data Ayah Kandung
	FatherName       string `json:"father_name"`
	FatherNIK        string `json:"father_nik"`
	FatherBirthYear  int    `json:"father_birth_year"`
	FatherEducation  string `json:"father_education"`
	FatherOccupation string `json:"father_occupation"`
	FatherIncome     int64  `json:"father_income"`
	FatherIsAlive    bool   `json:"father_is_alive"`

	// Data Ibu Kandung
	MotherName       string `json:"mother_name"`
	MotherNIK        string `json:"mother_nik"`
	MotherBirthYear  int    `json:"mother_birth_year"`
	MotherEducation  string `json:"mother_education"`
	MotherOccupation string `json:"mother_occupation"`
	MotherIncome     int64  `json:"mother_income"`
	MotherIsAlive    bool   `json:"mother_is_alive"`

	// Kontak orang tua utama
	ParentName  string `json:"parent_name"`
	ParentPhone string `json:"parent_phone"`

	// Data Wali
	GuardianName       string `json:"guardian_name"`
	GuardianNIK        string `json:"guardian_nik"`
	GuardianPhone      string `json:"guardian_phone"`
	GuardianOccupation string `json:"guardian_occupation"`
	GuardianRelation   string `json:"guardian_relation"`

	// Akademik
	EnrollmentDate string `json:"enrollment_date"`
}

// UpdateStudentRequest untuk pembaruan data siswa
type UpdateStudentRequest struct {
	NIS                string `json:"nis" validate:"required"`
	NISN               string `json:"nisn"`
	FullName           string `json:"full_name" validate:"required"`
	Gender             string `json:"gender" validate:"required"`
	BirthPlace         string `json:"birth_place"`
	BirthDate          string `json:"birth_date"`
	Religion           string `json:"religion"`
	Nationality        string `json:"nationality"`
	BirthCertificateNo string `json:"birth_certificate_no"`
	KKNumber           string `json:"kk_number"`
	PIPNumber          string `json:"pip_number"`
	PIPReason          string `json:"pip_reason"`
	ChildOrder         int    `json:"child_order"`
	NumSiblings        int    `json:"num_siblings"`
	LivingWith         string `json:"living_with"`
	Transportation     string `json:"transportation"`
	SpecialNeeds       string `json:"special_needs"`
	Address            string `json:"address"`
	RtRw               string `json:"rt_rw"`
	Village            string `json:"village"`
	District           string `json:"district"`
	City               string `json:"city"`
	Province           string `json:"province"`
	PostalCode         string `json:"postal_code"`
	Phone              string `json:"phone"`
	FatherName         string `json:"father_name"`
	FatherNIK          string `json:"father_nik"`
	FatherBirthYear    int    `json:"father_birth_year"`
	FatherEducation    string `json:"father_education"`
	FatherOccupation   string `json:"father_occupation"`
	FatherIncome       int64  `json:"father_income"`
	FatherIsAlive      bool   `json:"father_is_alive"`
	MotherName         string `json:"mother_name"`
	MotherNIK          string `json:"mother_nik"`
	MotherBirthYear    int    `json:"mother_birth_year"`
	MotherEducation    string `json:"mother_education"`
	MotherOccupation   string `json:"mother_occupation"`
	MotherIncome       int64  `json:"mother_income"`
	MotherIsAlive      bool   `json:"mother_is_alive"`
	ParentName         string `json:"parent_name"`
	ParentPhone        string `json:"parent_phone"`
	GuardianName       string `json:"guardian_name"`
	GuardianNIK        string `json:"guardian_nik"`
	GuardianPhone      string `json:"guardian_phone"`
	GuardianOccupation string `json:"guardian_occupation"`
	GuardianRelation   string `json:"guardian_relation"`
	EnrollmentDate     string `json:"enrollment_date"`
	ExitType           string `json:"exit_type"`
	ExitDate           string `json:"exit_date"`
	ExitReason         string `json:"exit_reason"`
}
