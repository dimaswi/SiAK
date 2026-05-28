package models

// Teacher adalah data lengkap guru sesuai standar Dapodik
type Teacher struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`

	// Identitas Utama
	NIP        string `json:"nip"`
	NUPTK      string `json:"nuptk"`
	FullName   string `json:"full_name"`
	Gender     string `json:"gender"` // 'L' or 'P'
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Religion   string `json:"religion"`
	Nationality string `json:"nationality"`
	MaritalStatus string `json:"marital_status"`

	// Identitas Dokumen
	NIK        string `json:"nik"`
	NPWP       string `json:"npwp"`

	// Kepegawaian
	EmployeeStatus  string `json:"employee_status"` // pns/pppk/gtt/honorer/kontrak
	Position        string `json:"position"`         // Jabatan di sekolah
	Subject         string `json:"subject"`          // Mata pelajaran
	TeachingHours   int    `json:"teaching_hours"`   // Jam mengajar/minggu
	Rank            string `json:"rank"`             // Golongan / Pangkat
	SKNumber        string `json:"sk_number"`        // No. SK Pengangkatan
	JoinDate        string `json:"join_date"`

	// Pendidikan Terakhir
	EducationLevel  string `json:"education_level"` // s1, s2, dll.
	EducationMajor  string `json:"education_major"`
	University      string `json:"university"`
	GraduationYear  int    `json:"graduation_year"`
	CertNumber      string `json:"cert_number"` // No. Sertifikat Pendidik

	// Kontak
	Phone   string `json:"phone"`
	Email   string `json:"email"`

	// Alamat
	Address    string `json:"address"`
	RtRw       string `json:"rt_rw"`
	Village    string `json:"village"`
	District   string `json:"district"`
	City       string `json:"city"`
	Province   string `json:"province"`
	PostalCode string `json:"postal_code"`

	// Meta
	PhotoURL string `json:"photo_url"`
	IsActive bool   `json:"is_active"`
}

// CreateTeacherRequest untuk pembuatan guru baru
type CreateTeacherRequest struct {
	// Akun
	NIP      string `json:"nip" validate:"required"`
	Password string `json:"password" validate:"required"`

	// Identitas Utama
	NUPTK         string `json:"nuptk"`
	FullName      string `json:"full_name" validate:"required"`
	Gender        string `json:"gender" validate:"required"`
	BirthPlace    string `json:"birth_place"`
	BirthDate     string `json:"birth_date"`
	Religion      string `json:"religion"`
	Nationality   string `json:"nationality"`
	MaritalStatus string `json:"marital_status"`

	// Identitas Dokumen
	NIK  string `json:"nik"`
	NPWP string `json:"npwp"`

	// Kepegawaian
	EmployeeStatus string `json:"employee_status"`
	Position       string `json:"position"`
	Subject        string `json:"subject"`
	TeachingHours  int    `json:"teaching_hours"`
	Rank           string `json:"rank"`
	SKNumber       string `json:"sk_number"`
	JoinDate       string `json:"join_date"`

	// Pendidikan Terakhir
	EducationLevel string `json:"education_level"`
	EducationMajor string `json:"education_major"`
	University     string `json:"university"`
	GraduationYear int    `json:"graduation_year"`
	CertNumber     string `json:"cert_number"`

	// Kontak
	Phone string `json:"phone"`
	Email string `json:"email"`

	// Alamat
	Address    string `json:"address"`
	RtRw       string `json:"rt_rw"`
	Village    string `json:"village"`
	District   string `json:"district"`
	City       string `json:"city"`
	Province   string `json:"province"`
	PostalCode string `json:"postal_code"`
}

// UpdateTeacherRequest untuk pembaruan data guru (sama dengan Create, tanpa password)
type UpdateTeacherRequest struct {
	NIP           string `json:"nip" validate:"required"`
	NUPTK         string `json:"nuptk"`
	FullName      string `json:"full_name" validate:"required"`
	Gender        string `json:"gender" validate:"required"`
	BirthPlace    string `json:"birth_place"`
	BirthDate     string `json:"birth_date"`
	Religion      string `json:"religion"`
	Nationality   string `json:"nationality"`
	MaritalStatus string `json:"marital_status"`
	NIK           string `json:"nik"`
	NPWP          string `json:"npwp"`
	EmployeeStatus string `json:"employee_status"`
	Position       string `json:"position"`
	Subject        string `json:"subject"`
	TeachingHours  int    `json:"teaching_hours"`
	Rank           string `json:"rank"`
	SKNumber       string `json:"sk_number"`
	JoinDate       string `json:"join_date"`
	EducationLevel string `json:"education_level"`
	EducationMajor string `json:"education_major"`
	University     string `json:"university"`
	GraduationYear int    `json:"graduation_year"`
	CertNumber     string `json:"cert_number"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	Address        string `json:"address"`
	RtRw           string `json:"rt_rw"`
	Village        string `json:"village"`
	District       string `json:"district"`
	City           string `json:"city"`
	Province       string `json:"province"`
	PostalCode     string `json:"postal_code"`
}
