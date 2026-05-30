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

func GetCMSPages(c echo.Context) error {
	rows, err := database.DB.Query(`
		SELECT id, key, title, content, COALESCE(meta_title,''), COALESCE(meta_description,''), is_published,
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_pages
		ORDER BY key ASC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal mengambil halaman CMS"})
	}
	defer rows.Close()

	items := []models.CMSPage{}
	for rows.Next() {
		var x models.CMSPage
		if err := rows.Scan(&x.ID, &x.Key, &x.Title, &x.Content, &x.MetaTitle, &x.MetaDescription, &x.IsPublished, &x.CreatedAt, &x.UpdatedAt); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal membaca data halaman CMS"})
		}
		items = append(items, x)
	}
	return c.JSON(http.StatusOK, items)
}

func UpsertCMSPage(c echo.Context) error {
	req := new(models.UpsertCMSPageRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request payload"})
	}
	req.Key = strings.TrimSpace(req.Key)
	req.Title = strings.TrimSpace(req.Title)
	if req.Key == "" || req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Key dan title wajib diisi"})
	}

	claims, _ := c.Get("user").(*middlewares.JwtCustomClaims)
	userID := ""
	if claims != nil {
		userID = claims.ID
	}

	var id string
	err := database.DB.QueryRow(`
		INSERT INTO cms_pages (key, title, content, meta_title, meta_description, is_published, created_by, updated_by)
		VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,'')::UUID,NULLIF($7,'')::UUID)
		ON CONFLICT (key) DO UPDATE SET
			title = EXCLUDED.title,
			content = EXCLUDED.content,
			meta_title = EXCLUDED.meta_title,
			meta_description = EXCLUDED.meta_description,
			is_published = EXCLUDED.is_published,
			updated_by = NULLIF($7,'')::UUID,
			updated_at = NOW()
		RETURNING id
	`, req.Key, req.Title, req.Content, req.MetaTitle, req.MetaDescription, req.IsPublished, userID).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menyimpan halaman CMS"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Halaman CMS berhasil disimpan", "id": id})
}

func DeleteCMSPage(c echo.Context) error {
	id := c.Param("id")
	_, err := database.DB.Exec("DELETE FROM cms_pages WHERE id = $1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Gagal menghapus halaman CMS"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Halaman CMS berhasil dihapus"})
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
func PublicGetCMSPage(c echo.Context) error {
	key := c.Param("key")
	var page models.CMSPage
	err := database.DB.QueryRow(`
		SELECT id, key, title, content, COALESCE(meta_title,''), COALESCE(meta_description,''), is_published,
		       CAST(created_at AS VARCHAR), CAST(updated_at AS VARCHAR)
		FROM cms_pages
		WHERE key = $1 AND is_published = true
	`, key).Scan(&page.ID, &page.Key, &page.Title, &page.Content, &page.MetaTitle, &page.MetaDescription, &page.IsPublished, &page.CreatedAt, &page.UpdatedAt)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Halaman tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, page)
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
