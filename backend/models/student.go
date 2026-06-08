package models

// Student adalah data lengkap siswa sesuai standar Dapodik
type Student struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`

	// Identitas Utama
	NIS      string `json:"nis"`
	NISM     string `json:"nism"`
	NISN     string `json:"nisn"`
	NIK      string `json:"nik"`
	FullName string `json:"full_name"`
	Gender   string `json:"gender"` // 'L' or 'P'
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Religion   string `json:"religion"`
	Nationality string `json:"nationality"`

	// Identitas Dokumen
	BirthCertificateNo string `json:"birth_certificate_no"`
	KKNumber           string `json:"kk_number"`

	// Kartu Bantuan Sosial
	KKSNumber string `json:"kks_number"`
	KPSNumber string `json:"kps_number"`
	KIPNumber string `json:"kip_number"`
	PKHNumber string `json:"pkh_number"`
	KISNumber string `json:"kis_number"`

	// Data Program Bantuan
	IsPIPReceiver bool   `json:"is_pip_receiver"`
	PIPNumber     string `json:"pip_number"`
	PIPReason     string `json:"pip_reason"`
	PIPPeriod     string `json:"pip_period"`

	// Data Sosial
	ChildOrder    int    `json:"child_order"`
	NumSiblings   int    `json:"num_siblings"`
	LivingWith    string `json:"living_with"`
	Transportation string `json:"transportation"`
	SpecialNeeds   string `json:"special_needs"`
	Hobby          string `json:"hobby"`
	Ambition       string `json:"ambition"`

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

	// Kelas & Prestasi
	ClassID           string `json:"class_id"`
	ClassAbsentNumber string `json:"class_absent_number"`
	ClassRank         int    `json:"class_rank"`

	AchievementField string `json:"achievement_field"`
	AchievementLevel string `json:"achievement_level"`
	AchievementRank  string `json:"achievement_rank"`
	AchievementYear  int    `json:"achievement_year"`

	ScholarshipStatus         string `json:"scholarship_status"`
	ScholarshipSource         string `json:"scholarship_source"`
	ScholarshipType           string `json:"scholarship_type"`
	ScholarshipDurationMonths int    `json:"scholarship_duration_months"`
	ScholarshipAmount         int64  `json:"scholarship_amount"`

	// Asal Sekolah
	PreviousSchoolType   string `json:"previous_school_type"`
	PreviousSchoolStatus string `json:"previous_school_status"`
	PreviousSchoolCity   string `json:"previous_school_city"`

	// Data Ayah Kandung
	FatherName       string `json:"father_name"`
	FatherNIK        string `json:"father_nik"`
	FatherBirthYear  int    `json:"father_birth_year"`
	FatherBirthDate  string `json:"father_birth_date"`
	FatherEducation  string `json:"father_education"`
	FatherOccupation string `json:"father_occupation"`
	FatherIncome     int64  `json:"father_income"`
	FatherIsAlive    bool   `json:"father_is_alive"`

	// Data Ibu Kandung
	MotherName       string `json:"mother_name"`
	MotherNIK        string `json:"mother_nik"`
	MotherBirthYear  int    `json:"mother_birth_year"`
	MotherBirthDate  string `json:"mother_birth_date"`
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
	NISM       string `json:"nism"`
	NISN       string `json:"nisn"`
	NIK        string `json:"nik"`
	FullName   string `json:"full_name" validate:"required"`
	Gender     string `json:"gender" validate:"required"`
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Religion   string `json:"religion"`
	Nationality string `json:"nationality"`

	// Identitas Dokumen
	BirthCertificateNo string `json:"birth_certificate_no"`
	KKNumber           string `json:"kk_number"`

	// Kartu Bantuan
	KKSNumber string `json:"kks_number"`
	KPSNumber string `json:"kps_number"`
	KIPNumber string `json:"kip_number"`
	PKHNumber string `json:"pkh_number"`
	KISNumber string `json:"kis_number"`

	IsPIPReceiver bool   `json:"is_pip_receiver"`
	PIPNumber     string `json:"pip_number"`
	PIPReason     string `json:"pip_reason"`
	PIPPeriod     string `json:"pip_period"`

	// Data Sosial
	ChildOrder     int    `json:"child_order"`
	NumSiblings    int    `json:"num_siblings"`
	LivingWith     string `json:"living_with"`
	Transportation string `json:"transportation"`
	SpecialNeeds   string `json:"special_needs"`
	Hobby          string `json:"hobby"`
	Ambition       string `json:"ambition"`

	// Alamat
	Address    string `json:"address"`
	RtRw       string `json:"rt_rw"`
	Village    string `json:"village"`
	District   string `json:"district"`
	City       string `json:"city"`
	Province   string `json:"province"`
	PostalCode string `json:"postal_code"`

	Phone string `json:"phone"`

	// Kelas & Prestasi
	ClassAbsentNumber string `json:"class_absent_number"`
	ClassRank         int    `json:"class_rank"`

	AchievementField string `json:"achievement_field"`
	AchievementLevel string `json:"achievement_level"`
	AchievementRank  string `json:"achievement_rank"`
	AchievementYear  int    `json:"achievement_year"`

	ScholarshipStatus         string `json:"scholarship_status"`
	ScholarshipSource         string `json:"scholarship_source"`
	ScholarshipType           string `json:"scholarship_type"`
	ScholarshipDurationMonths int    `json:"scholarship_duration_months"`
	ScholarshipAmount         int64  `json:"scholarship_amount"`

	// Asal Sekolah
	PreviousSchoolType   string `json:"previous_school_type"`
	PreviousSchoolStatus string `json:"previous_school_status"`
	PreviousSchoolCity   string `json:"previous_school_city"`

	// Data Ayah Kandung
	FatherName       string `json:"father_name"`
	FatherNIK        string `json:"father_nik"`
	FatherBirthYear  int    `json:"father_birth_year"`
	FatherBirthDate  string `json:"father_birth_date"`
	FatherEducation  string `json:"father_education"`
	FatherOccupation string `json:"father_occupation"`
	FatherIncome     int64  `json:"father_income"`
	FatherIsAlive    bool   `json:"father_is_alive"`

	// Data Ibu Kandung
	MotherName       string `json:"mother_name"`
	MotherNIK        string `json:"mother_nik"`
	MotherBirthYear  int    `json:"mother_birth_year"`
	MotherBirthDate  string `json:"mother_birth_date"`
	MotherEducation  string `json:"mother_education"`
	MotherOccupation string `json:"mother_occupation"`
	MotherIncome     int64  `json:"mother_income"`
	MotherIsAlive    bool   `json:"mother_is_alive"`

	ParentName  string `json:"parent_name"`
	ParentPhone string `json:"parent_phone"`

	GuardianName       string `json:"guardian_name"`
	GuardianNIK        string `json:"guardian_nik"`
	GuardianPhone      string `json:"guardian_phone"`
	GuardianOccupation string `json:"guardian_occupation"`
	GuardianRelation   string `json:"guardian_relation"`

	EnrollmentDate string `json:"enrollment_date"`
}

// UpdateStudentRequest untuk pembaruan data siswa
type UpdateStudentRequest struct {
	NIS                string `json:"nis" validate:"required"`
	NISM               string `json:"nism"`
	NISN               string `json:"nisn"`
	NIK                string `json:"nik"`
	FullName           string `json:"full_name" validate:"required"`
	Gender             string `json:"gender" validate:"required"`
	BirthPlace         string `json:"birth_place"`
	BirthDate          string `json:"birth_date"`
	Religion           string `json:"religion"`
	Nationality        string `json:"nationality"`
	BirthCertificateNo string `json:"birth_certificate_no"`
	KKNumber           string `json:"kk_number"`

	KKSNumber string `json:"kks_number"`
	KPSNumber string `json:"kps_number"`
	KIPNumber string `json:"kip_number"`
	PKHNumber string `json:"pkh_number"`
	KISNumber string `json:"kis_number"`

	IsPIPReceiver bool   `json:"is_pip_receiver"`
	PIPNumber     string `json:"pip_number"`
	PIPReason     string `json:"pip_reason"`
	PIPPeriod     string `json:"pip_period"`

	ChildOrder         int    `json:"child_order"`
	NumSiblings        int    `json:"num_siblings"`
	LivingWith         string `json:"living_with"`
	Transportation     string `json:"transportation"`
	SpecialNeeds       string `json:"special_needs"`
	Hobby              string `json:"hobby"`
	Ambition           string `json:"ambition"`

	Address            string `json:"address"`
	RtRw               string `json:"rt_rw"`
	Village            string `json:"village"`
	District           string `json:"district"`
	City               string `json:"city"`
	Province           string `json:"province"`
	PostalCode         string `json:"postal_code"`
	Phone              string `json:"phone"`

	ClassAbsentNumber string `json:"class_absent_number"`
	ClassRank         int    `json:"class_rank"`

	AchievementField string `json:"achievement_field"`
	AchievementLevel string `json:"achievement_level"`
	AchievementRank  string `json:"achievement_rank"`
	AchievementYear  int    `json:"achievement_year"`

	ScholarshipStatus         string `json:"scholarship_status"`
	ScholarshipSource         string `json:"scholarship_source"`
	ScholarshipType           string `json:"scholarship_type"`
	ScholarshipDurationMonths int    `json:"scholarship_duration_months"`
	ScholarshipAmount         int64  `json:"scholarship_amount"`

	PreviousSchoolType   string `json:"previous_school_type"`
	PreviousSchoolStatus string `json:"previous_school_status"`
	PreviousSchoolCity   string `json:"previous_school_city"`

	FatherName         string `json:"father_name"`
	FatherNIK          string `json:"father_nik"`
	FatherBirthYear    int    `json:"father_birth_year"`
	FatherBirthDate    string `json:"father_birth_date"`
	FatherEducation    string `json:"father_education"`
	FatherOccupation   string `json:"father_occupation"`
	FatherIncome       int64  `json:"father_income"`
	FatherIsAlive      bool   `json:"father_is_alive"`

	MotherName         string `json:"mother_name"`
	MotherNIK          string `json:"mother_nik"`
	MotherBirthYear    int    `json:"mother_birth_year"`
	MotherBirthDate    string `json:"mother_birth_date"`
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
