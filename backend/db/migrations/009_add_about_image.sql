-- Migration 009: Add about image
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS about_image_url TEXT DEFAULT '';
