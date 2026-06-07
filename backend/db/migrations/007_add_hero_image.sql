-- Migration 007: Add hero image url

ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT '';
