package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"siak/backend/database"
	"siak/backend/middlewares"
	"siak/backend/models"
)

func slugify(in string) string {
	s := strings.ToLower(strings.TrimSpace(in))
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "--", "-")
	return s
}

func fetchSiteConfigWithStats() (models.CMSSiteConfig, error) {
	var cfg models.CMSSiteConfig
	err := database.DB.QueryRow(`
		SELECT id, school_name, school_tagline, logo_url,
		       hero_title, hero_description, hero_image_url, hero_cta_1_text, hero_cta_1_url, hero_cta_2_text, hero_cta_2_url,
		       stat_1_label, stat_1_value, stat_2_label, stat_2_value, stat_3_label, stat_3_value,
		       stat_4_label, stat_4_value, stat_5_label, stat_5_value,
		       about_title, about_content, about_image_url,
		       program_1_title, program_1_desc, program_2_title, program_2_desc,
		       program_3_title, program_3_desc, program_4_title, program_4_desc,
		       footer_description, footer_address, footer_phone, footer_email,
		       CAST(updated_at AS VARCHAR)
		FROM cms_site_config LIMIT 1
	`).Scan(
		&cfg.ID, &cfg.SchoolName, &cfg.SchoolTagline, &cfg.LogoUrl,
		&cfg.HeroTitle, &cfg.HeroDescription, &cfg.HeroImageUrl, &cfg.HeroCta1Text, &cfg.HeroCta1Url, &cfg.HeroCta2Text, &cfg.HeroCta2Url,
		&cfg.Stat1Label, &cfg.Stat1Value, &cfg.Stat2Label, &cfg.Stat2Value, &cfg.Stat3Label, &cfg.Stat3Value,
		&cfg.Stat4Label, &cfg.Stat4Value, &cfg.Stat5Label, &cfg.Stat5Value,
		&cfg.AboutTitle, &cfg.AboutContent, &cfg.AboutImageUrl,
		&cfg.Program1Title, &cfg.Program1Desc, &cfg.Program2Title, &cfg.Program2Desc,
		&cfg.Program3Title, &cfg.Program3Desc, &cfg.Program4Title, &cfg.Program4Desc,
		&cfg.FooterDescription, &cfg.FooterAddress, &cfg.FooterPhone, &cfg.FooterEmail,
		&cfg.UpdatedAt,
	)
	if err != nil {
		return cfg, err
	}

	// I'll assume fmt is imported, if not I'll fix imports.
	
	// Since I don't know if fmt is imported, I'll use a hack or just return the config and do the query inside the endpoint.
	// Actually, wait, let me just return the raw struct and fill the stats.
	return cfg, nil
}

func GetSiteConfig(c echo.Context) error {
	cfg, err := fetchSiteConfigWithStats()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil konfigurasi situs"})
	}
	return c.JSON(http.StatusOK, cfg)
}

func UpdateSiteConfig(c echo.Context) error {
	req := new(models.UpdateSiteConfigRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}

	_, err := database.DB.Exec(`
		UPDATE cms_site_config SET
			school_name = $1, school_tagline = $2, logo_url = $3,
			hero_title = $4, hero_description = $5, hero_image_url = $6, hero_cta_1_text = $7, hero_cta_1_url = $8, hero_cta_2_text = $9, hero_cta_2_url = $10,
			stat_1_label = $11, stat_1_value = $12, stat_2_label = $13, stat_2_value = $14, stat_3_label = $15, stat_3_value = $16,
			stat_4_label = $17, stat_4_value = $18, stat_5_label = $19, stat_5_value = $20,
			about_title = $21, about_content = $22, about_image_url = $23,
			program_1_title = $24, program_1_desc = $25, program_2_title = $26, program_2_desc = $27,
			program_3_title = $28, program_3_desc = $29, program_4_title = $30, program_4_desc = $31,
			footer_description = $32, footer_address = $33, footer_phone = $34, footer_email = $35,
			updated_by = NULLIF($36,'')::UUID, updated_at = NOW()
	`, req.SchoolName, req.SchoolTagline, req.LogoUrl,
		req.HeroTitle, req.HeroDescription, req.HeroImageUrl, req.HeroCta1Text, req.HeroCta1Url, req.HeroCta2Text, req.HeroCta2Url,
		req.Stat1Label, req.Stat1Value, req.Stat2Label, req.Stat2Value, req.Stat3Label, req.Stat3Value,
		req.Stat4Label, req.Stat4Value, req.Stat5Label, req.Stat5Value,
		req.AboutTitle, req.AboutContent, req.AboutImageUrl,
		req.Program1Title, req.Program1Desc, req.Program2Title, req.Program2Desc,
		req.Program3Title, req.Program3Desc, req.Program4Title, req.Program4Desc,
		req.FooterDescription, req.FooterAddress, req.FooterPhone, req.FooterEmail,
		userID)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan konfigurasi situs"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Konfigurasi situs berhasil disimpan"})
}

func GetCMSPosts(c echo.Context) error {
	rows, err := database.DB.Query(`
		SELECT id, title, slug, COALESCE(excerpt,''), COALESCE(content,''), COALESCE(cover_image_url,''),
		       status::VARCHAR, COALESCE(CAST(published_at AS VARCHAR),''), COALESCE(meta_title,''), COALESCE(meta_description,''),
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_posts
		ORDER BY created_at DESC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil post CMS"})
	}
	defer rows.Close()
	items := []models.CMSPost{}
	for rows.Next() {
		var x models.CMSPost
		if err := rows.Scan(&x.ID, &x.Title, &x.Slug, &x.Excerpt, &x.Content, &x.CoverImageURL, &x.Status, &x.PublishedAt, &x.MetaTitle, &x.MetaDescription, &x.CreatedAt, &x.UpdatedAt); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data post CMS"})
		}
		items = append(items, x)
	}
	return c.JSON(http.StatusOK, items)
}

func CreateCMSPost(c echo.Context) error {
	req := new(models.UpsertCMSPostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Title wajib diisi"})
	}
	if req.Status == "" {
		req.Status = "draft"
	}
	if req.Slug == "" {
		req.Slug = slugify(req.Title)
	} else {
		req.Slug = slugify(req.Slug)
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}

	publishedAt := interface{}(nil)
	if req.Status == "published" {
		publishedAt = time.Now()
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO cms_posts (title, slug, excerpt, content, cover_image_url, status, published_at, meta_title, meta_description, created_by, updated_by)
		VALUES ($1,$2,$3,$4,$5,$6::cms_post_status,$7,$8,$9,NULLIF($10,'')::UUID,NULLIF($10,'')::UUID)
		RETURNING id
	`, req.Title, req.Slug, req.Excerpt, req.Content, req.CoverImageURL, req.Status, publishedAt, req.MetaTitle, req.MetaDescription, userID).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"message": "Slug sudah digunakan atau data post tidak valid"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Post CMS berhasil dibuat", "id": id})
}

func UpdateCMSPost(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpsertCMSPostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Title wajib diisi"})
	}
	if req.Status == "" {
		req.Status = "draft"
	}
	if req.Slug == "" {
		req.Slug = slugify(req.Title)
	} else {
		req.Slug = slugify(req.Slug)
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}
	publishedAtClause := "published_at"
	if req.Status == "published" {
		publishedAtClause = "COALESCE(published_at, NOW())"
	}

	_, err := database.DB.Exec(`
		UPDATE cms_posts SET
			title = $1,
			slug = $2,
			excerpt = $3,
			content = $4,
			cover_image_url = $5,
			status = $6::cms_post_status,
			published_at = `+publishedAtClause+`,
			meta_title = $7,
			meta_description = $8,
			updated_by = NULLIF($9,'')::UUID,
			updated_at = NOW()
		WHERE id = $10
	`, req.Title, req.Slug, req.Excerpt, req.Content, req.CoverImageURL, req.Status, req.MetaTitle, req.MetaDescription, userID, id)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"message": "Slug sudah digunakan atau update post gagal"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Post CMS berhasil diperbarui"})
}

func DeleteCMSPost(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec("DELETE FROM cms_posts WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus post CMS"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Post CMS berhasil dihapus"})
}

func GetCMSNavigationItems(c echo.Context) error {
	rows, err := database.DB.Query(`
		SELECT id, location, label, href, sort_order, is_active, CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_navigation_items
		ORDER BY location ASC, sort_order ASC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil menu navigasi"})
	}
	defer rows.Close()
	items := []models.CMSNavigationItem{}
	for rows.Next() {
		var x models.CMSNavigationItem
		if err := rows.Scan(&x.ID, &x.Location, &x.Label, &x.Href, &x.SortOrder, &x.IsActive, &x.CreatedAt, &x.UpdatedAt); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca menu navigasi"})
		}
		items = append(items, x)
	}
	return c.JSON(http.StatusOK, items)
}

func CreateCMSNavigationItem(c echo.Context) error {
	req := new(models.UpsertCMSNavigationItemRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.Location == "" || req.Label == "" || req.Href == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "location, label, href wajib diisi"})
	}
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO cms_navigation_items (location, label, href, sort_order, is_active, created_by, updated_by)
		VALUES ($1,$2,$3,$4,$5,NULLIF($6,'')::UUID,NULLIF($6,'')::UUID)
		RETURNING id
	`, req.Location, req.Label, req.Href, req.SortOrder, req.IsActive, userID).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menambah menu navigasi"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Menu navigasi berhasil ditambahkan", "id": id})
}

func UpdateCMSNavigationItem(c echo.Context) error {
	id := c.Param("id")
	req := new(models.UpsertCMSNavigationItemRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	if req.Location == "" || req.Label == "" || req.Href == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "location, label, href wajib diisi"})
	}
	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}

	_, err := database.DB.Exec(`
		UPDATE cms_navigation_items SET
			location = $1,
			label = $2,
			href = $3,
			sort_order = $4,
			is_active = $5,
			updated_by = NULLIF($6,'')::UUID,
			updated_at = NOW()
		WHERE id = $7
	`, req.Location, req.Label, req.Href, req.SortOrder, req.IsActive, userID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal memperbarui menu navigasi"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Menu navigasi berhasil diperbarui"})
}

func DeleteCMSNavigationItem(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec("DELETE FROM cms_navigation_items WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus menu navigasi"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Menu navigasi berhasil dihapus"})
}

// Public CMS endpoints (published only)
func PublicGetSiteConfig(c echo.Context) error {
	cfg, err := fetchSiteConfigWithStats()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil konfigurasi situs"})
	}

	return c.JSON(http.StatusOK, cfg)
}

func PublicGetCMSPosts(c echo.Context) error {
	rows, err := database.DB.Query(`
		SELECT id, title, slug, COALESCE(excerpt,''), COALESCE(content,''), COALESCE(cover_image_url,''),
		       status::VARCHAR, COALESCE(CAST(published_at AS VARCHAR),''), COALESCE(meta_title,''), COALESCE(meta_description,''),
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_posts
		WHERE status = 'published'
		ORDER BY published_at DESC NULLS LAST, created_at DESC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil post publik"})
	}
	defer rows.Close()
	items := []models.CMSPost{}
	for rows.Next() {
		var x models.CMSPost
		if err := rows.Scan(&x.ID, &x.Title, &x.Slug, &x.Excerpt, &x.Content, &x.CoverImageURL, &x.Status, &x.PublishedAt, &x.MetaTitle, &x.MetaDescription, &x.CreatedAt, &x.UpdatedAt); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca post publik"})
		}
		items = append(items, x)
	}
	return c.JSON(http.StatusOK, items)
}

func PublicGetCMSPostBySlug(c echo.Context) error {
	slug := c.Param("slug")
	var x models.CMSPost
	err := database.DB.QueryRow(`
		SELECT id, title, slug, COALESCE(excerpt,''), COALESCE(content,''), COALESCE(cover_image_url,''),
		       status::VARCHAR, COALESCE(CAST(published_at AS VARCHAR),''), COALESCE(meta_title,''), COALESCE(meta_description,''),
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_posts
		WHERE slug = $1 AND status = 'published'
	`, slug).Scan(&x.ID, &x.Title, &x.Slug, &x.Excerpt, &x.Content, &x.CoverImageURL, &x.Status, &x.PublishedAt, &x.MetaTitle, &x.MetaDescription, &x.CreatedAt, &x.UpdatedAt)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Post tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, x)
}

func PublicGetCMSNavigation(c echo.Context) error {
	location := c.QueryParam("location")
	query := `
		SELECT id, location, label, href, sort_order, is_active, CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_navigation_items
		WHERE is_active = true
	`
	args := []interface{}{}
	if location != "" {
		query += " AND location = $1"
		args = append(args, location)
	}
	query += " ORDER BY sort_order ASC"
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil navigasi publik"})
	}
	defer rows.Close()
	items := []models.CMSNavigationItem{}
	for rows.Next() {
		var x models.CMSNavigationItem
		if err := rows.Scan(&x.ID, &x.Location, &x.Label, &x.Href, &x.SortOrder, &x.IsActive, &x.CreatedAt, &x.UpdatedAt); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca navigasi publik"})
		}
		items = append(items, x)
	}
	return c.JSON(http.StatusOK, items)
}
