-- Migration 008: Add custom stats

ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_1_value TEXT DEFAULT '';
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_2_value TEXT DEFAULT '';
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_3_value TEXT DEFAULT '';
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_4_label TEXT DEFAULT '';
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_4_value TEXT DEFAULT '';
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_5_label TEXT DEFAULT '';
ALTER TABLE cms_site_config ADD COLUMN IF NOT EXISTS stat_5_value TEXT DEFAULT '';
