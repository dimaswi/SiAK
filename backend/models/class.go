package models

type Class struct {
	ID                  string `json:"id"`
	Name                string `json:"name"`
	GradeLevel          int    `json:"grade_level"`
	AcademicYear        string `json:"academic_year"`
	HomeroomTeacherID   string `json:"homeroom_teacher_id"`
	HomeroomTeacherName string `json:"homeroom_teacher_name,omitempty"`
	StudentCount        int    `json:"student_count,omitempty"`
	CreatedAt           string `json:"created_at"`
	UpdatedAt           string `json:"updated_at"`
}

type CreateClassRequest struct {
	Name              string `json:"name"`
	GradeLevel        int    `json:"grade_level"`
	AcademicYear      string `json:"academic_year"`
	HomeroomTeacherID string `json:"homeroom_teacher_id"`
}

type AssignStudentsRequest struct {
	StudentIDs []string `json:"student_ids"`
}
