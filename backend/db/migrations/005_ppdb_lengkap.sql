-- ============================================================
-- Migration 005: Extend PPDB Applications for Comprehensive Data
-- ============================================================

ALTER TABLE ppdb_applications
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255),
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS father_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS parent_income VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_kk VARCHAR(255),
ADD COLUMN IF NOT EXISTS document_akta VARCHAR(255);
