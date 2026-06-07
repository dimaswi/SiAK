package models

type CMSSiteConfig struct {
	ID                 string `json:"id"`
	SchoolName         string `json:"school_name"`
	SchoolTagline      string `json:"school_tagline"`
	LogoUrl            string `json:"logo_url"`
	HeroTitle          string `json:"hero_title"`
	HeroDescription    string `json:"hero_description"`
	HeroImageUrl       string `json:"hero_image_url"`
	HeroCta1Text       string `json:"hero_cta_1_text"`
	HeroCta1Url        string `json:"hero_cta_1_url"`
	HeroCta2Text       string `json:"hero_cta_2_text"`
	HeroCta2Url        string `json:"hero_cta_2_url"`
	Stat1Label         string `json:"stat_1_label"`
	Stat1Value         string `json:"stat_1_value"` // dynamic
	Stat2Label         string `json:"stat_2_label"`
	Stat2Value         string `json:"stat_2_value"` // dynamic
	Stat3Label         string `json:"stat_3_label"`
	Stat3Value         string `json:"stat_3_value"`
	Stat4Label         string `json:"stat_4_label"`
	Stat4Value         string `json:"stat_4_value"`
	Stat5Label         string `json:"stat_5_label"`
	Stat5Value         string `json:"stat_5_value"`
	AboutTitle         string `json:"about_title"`
	AboutContent       string `json:"about_content"`
	AboutImageUrl      string `json:"about_image_url"`
	Program1Title      string `json:"program_1_title"`
	Program1Desc       string `json:"program_1_desc"`
	Program2Title      string `json:"program_2_title"`
	Program2Desc       string `json:"program_2_desc"`
	Program3Title      string `json:"program_3_title"`
	Program3Desc       string `json:"program_3_desc"`
	Program4Title      string `json:"program_4_title"`
	Program4Desc       string `json:"program_4_desc"`
	FooterDescription  string `json:"footer_description"`
	FooterAddress      string `json:"footer_address"`
	FooterPhone        string `json:"footer_phone"`
	FooterEmail        string `json:"footer_email"`
	UpdatedAt          string `json:"updated_at"`
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

type UpdateSiteConfigRequest struct {
	SchoolName        string `json:"school_name"`
	SchoolTagline     string `json:"school_tagline"`
	LogoUrl           string `json:"logo_url"`
	HeroTitle         string `json:"hero_title"`
	HeroDescription   string `json:"hero_description"`
	HeroImageUrl      string `json:"hero_image_url"`
	HeroCta1Text      string `json:"hero_cta_1_text"`
	HeroCta1Url       string `json:"hero_cta_1_url"`
	HeroCta2Text      string `json:"hero_cta_2_text"`
	HeroCta2Url       string `json:"hero_cta_2_url"`
	Stat1Label        string `json:"stat_1_label"`
	Stat1Value        string `json:"stat_1_value"`
	Stat2Label        string `json:"stat_2_label"`
	Stat2Value        string `json:"stat_2_value"`
	Stat3Label        string `json:"stat_3_label"`
	Stat3Value        string `json:"stat_3_value"`
	Stat4Label        string `json:"stat_4_label"`
	Stat4Value        string `json:"stat_4_value"`
	Stat5Label        string `json:"stat_5_label"`
	Stat5Value        string `json:"stat_5_value"`
	AboutTitle        string `json:"about_title"`
	AboutContent      string `json:"about_content"`
	AboutImageUrl     string `json:"about_image_url"`
	Program1Title     string `json:"program_1_title"`
	Program1Desc      string `json:"program_1_desc"`
	Program2Title     string `json:"program_2_title"`
	Program2Desc      string `json:"program_2_desc"`
	Program3Title     string `json:"program_3_title"`
	Program3Desc      string `json:"program_3_desc"`
	Program4Title     string `json:"program_4_title"`
	Program4Desc      string `json:"program_4_desc"`
	FooterDescription string `json:"footer_description"`
	FooterAddress     string `json:"footer_address"`
	FooterPhone       string `json:"footer_phone"`
	FooterEmail       string `json:"footer_email"`
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
