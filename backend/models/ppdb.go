package models

type PPDBApplication struct {
	ID               string `json:"id"`
	RegistrationNo   string `json:"registration_no"`
	FullName         string `json:"full_name"`
	NISN             string `json:"nisn"`
	BirthDate        string `json:"birth_date"`
	Gender           string `json:"gender"`
	Religion         string `json:"religion"`
	PlaceOfBirth     string `json:"place_of_birth"`
	Address          string `json:"address"`
	PreviousSchool   string `json:"previous_school"`
	ParentPhone      string `json:"parent_phone"`
	FatherName       string `json:"father_name"`
	FatherOccupation string `json:"father_occupation"`
	FatherPhone      string `json:"father_phone"`
	MotherName       string `json:"mother_name"`
	MotherOccupation string `json:"mother_occupation"`
	MotherPhone      string `json:"mother_phone"`
	ParentIncome     string `json:"parent_income"`
	DocumentKK       string `json:"document_kk"`
	DocumentAkta     string `json:"document_akta"`
	Status           string `json:"status"`
	NotesPanitia     string `json:"notes_panitia"`
	ConvertedStudent string `json:"converted_student_id"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
}

type PublicPPDBRegisterRequest struct {
	FullName         string `json:"full_name"`
	NISN             string `json:"nisn"`
	BirthDate        string `json:"birth_date"`
	Gender           string `json:"gender"`
	Religion         string `json:"religion"`
	PlaceOfBirth     string `json:"place_of_birth"`
	Address          string `json:"address"`
	PreviousSchool   string `json:"previous_school"`
	ParentPhone      string `json:"parent_phone"`
	FatherName       string `json:"father_name"`
	FatherOccupation string `json:"father_occupation"`
	FatherPhone      string `json:"father_phone"`
	MotherName       string `json:"mother_name"`
	MotherOccupation string `json:"mother_occupation"`
	MotherPhone      string `json:"mother_phone"`
	ParentIncome     string `json:"parent_income"`
	DocumentKK       string `json:"document_kk"`
	DocumentAkta     string `json:"document_akta"`
}

type PublicPPDBStatusQuery struct {
	RegistrationNo string `json:"registration_no"`
	BirthDate      string `json:"birth_date"`
}

type UpdatePPDBStatusRequest struct {
	Status       string `json:"status"`
	NotesPanitia string `json:"notes_panitia"`
}

type ConvertPPDBToStudentRequest struct {
	NIS            string `json:"nis"`
	Password       string `json:"password"`
	Gender         string `json:"gender"`
	ClassID        string `json:"class_id"`
	EnrollmentDate string `json:"enrollment_date"`
}
