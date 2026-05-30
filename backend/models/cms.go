package models

type CMSPage struct {
	ID              string `json:"id"`
	Key             string `json:"key"`
	Title           string `json:"title"`
	Content         string `json:"content"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	IsPublished     bool   `json:"is_published"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type CMSPost struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Slug            string `json:"slug"`
	Excerpt         string `json:"excerpt"`
	Content         string `json:"content"`
	CoverImageURL   string `json:"cover_image_url"`
	Status          string `json:"status"`
	PublishedAt     string `json:"published_at"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type CMSNavigationItem struct {
	ID        string `json:"id"`
	Location  string `json:"location"`
	Label     string `json:"label"`
	Href      string `json:"href"`
	SortOrder int    `json:"sort_order"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpsertCMSPageRequest struct {
	Key             string `json:"key"`
	Title           string `json:"title"`
	Content         string `json:"content"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	IsPublished     bool   `json:"is_published"`
}

type UpsertCMSPostRequest struct {
	Title           string `json:"title"`
	Slug            string `json:"slug"`
	Excerpt         string `json:"excerpt"`
	Content         string `json:"content"`
	CoverImageURL   string `json:"cover_image_url"`
	Status          string `json:"status"` // draft / published
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
}

type UpsertCMSNavigationItemRequest struct {
	Location  string `json:"location"`
	Label     string `json:"label"`
	Href      string `json:"href"`
	SortOrder int    `json:"sort_order"`
	IsActive  bool   `json:"is_active"`
}

type CMSMediaItem struct {
	ID        string `json:"id"`
	FileName  string `json:"file_name"`
	FilePath  string `json:"file_path"`
	FileType  string `json:"file_type"`
	FileSize  int64  `json:"file_size"`
	CreatedAt string `json:"created_at"`
}
