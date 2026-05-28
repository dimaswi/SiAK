package models

type LoginRequest struct {
	Identifier string `json:"identifier" validate:"required"`
	Password   string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type User struct {
	ID                 string `json:"id"`
	Identifier         string `json:"identifier"`
	Role               string `json:"role"`
	IsActive           bool   `json:"is_active"`
	MustChangePassword bool   `json:"must_change_password"`
}

type UpdateRoleRequest struct {
	Role string `json:"role" validate:"required"`
}

type UpdatePasswordRequest struct {
	Password string `json:"password" validate:"required"`
}
