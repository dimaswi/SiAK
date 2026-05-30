-- ============================================================
-- Migration 004: PPDB Applications
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ppdb_status') THEN
        CREATE TYPE ppdb_status AS ENUM ('baru', 'verifikasi_berkas', 'lulus', 'cadangan', 'ditolak', 'daftar_ulang');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS ppdb_applications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_no     VARCHAR(40) NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    nisn                VARCHAR(20),
    birth_date          DATE NOT NULL,
    parent_phone        VARCHAR(30) NOT NULL,
    status              ppdb_status NOT NULL DEFAULT 'baru',
    notes_panitia       TEXT,
    status_updated_at   TIMESTAMPTZ,
    status_updated_by   UUID REFERENCES users(id),
    converted_student_id UUID REFERENCES students(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppdb_status ON ppdb_applications(status, created_at DESC);
