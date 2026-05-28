-- ============================================================
-- SiAK - Sistem Informasi Akademik Sekolah
-- Migration 002: Ekspansi Field Guru, Murid & Modul SPP
-- Standar: Dapodik (Data Pokok Pendidikan) Kemdikbud RI
-- ============================================================

-- ============================================================
-- NEW ENUM TYPES
-- ============================================================
CREATE TYPE employee_status AS ENUM ('pns', 'pppk', 'gtt', 'honorer', 'kontrak');
CREATE TYPE marital_status AS ENUM ('belum_kawin', 'kawin', 'cerai_hidup', 'cerai_mati');
CREATE TYPE education_level AS ENUM ('sd', 'smp', 'sma', 'smk', 'd1', 'd2', 'd3', 'd4', 's1', 's2', 's3');
CREATE TYPE student_exit_type AS ENUM ('lulus', 'pindah', 'putus_sekolah', 'meninggal');
CREATE TYPE spp_payment_status AS ENUM ('belum_bayar', 'pending_verifikasi', 'lunas', 'bebas_spp');

-- ============================================================
-- ALTER TABLE: teachers — Tambahan field Dapodik
-- ============================================================
ALTER TABLE teachers
    -- Identitas Nasional
    ADD COLUMN IF NOT EXISTS nuptk              VARCHAR(16) UNIQUE,         -- Nomor Unik PTK
    ADD COLUMN IF NOT EXISTS nik                VARCHAR(20) UNIQUE,         -- NIK (No. KTP)
    ADD COLUMN IF NOT EXISTS npwp               VARCHAR(20) UNIQUE,         -- NPWP
    ADD COLUMN IF NOT EXISTS religion           VARCHAR(50),                -- Agama
    ADD COLUMN IF NOT EXISTS nationality        VARCHAR(50) DEFAULT 'WNI',  -- Kewarganegaraan
    ADD COLUMN IF NOT EXISTS marital_status     marital_status,             -- Status Kawin

    -- Kepegawaian
    ADD COLUMN IF NOT EXISTS employee_status    employee_status,            -- Status Kepegawaian
    ADD COLUMN IF NOT EXISTS position           VARCHAR(150),               -- Jabatan (Wali Kelas, Kepala Lab, dll.)
    ADD COLUMN IF NOT EXISTS teaching_hours     INTEGER,                    -- Jam mengajar per minggu
    ADD COLUMN IF NOT EXISTS sk_number          VARCHAR(100),               -- Nomor SK Pengangkatan

    -- Pendidikan
    ADD COLUMN IF NOT EXISTS education_level    education_level,            -- Jenjang Pendidikan
    ADD COLUMN IF NOT EXISTS education_major    VARCHAR(150),               -- Jurusan / Prodi
    ADD COLUMN IF NOT EXISTS university         VARCHAR(255),               -- Nama Universitas
    ADD COLUMN IF NOT EXISTS graduation_year    INTEGER,                    -- Tahun Lulus
    ADD COLUMN IF NOT EXISTS cert_number        VARCHAR(100),               -- No. Sertifikat Pendidik

    -- Alamat Detail
    ADD COLUMN IF NOT EXISTS rt_rw              VARCHAR(10),                -- RT/RW
    ADD COLUMN IF NOT EXISTS village            VARCHAR(100),               -- Kelurahan / Desa
    ADD COLUMN IF NOT EXISTS district           VARCHAR(100),               -- Kecamatan
    ADD COLUMN IF NOT EXISTS city               VARCHAR(100),               -- Kota / Kabupaten
    ADD COLUMN IF NOT EXISTS province           VARCHAR(100),               -- Provinsi
    ADD COLUMN IF NOT EXISTS postal_code        VARCHAR(10);                -- Kode Pos

-- ============================================================
-- ALTER TABLE: students — Tambahan field Dapodik
-- ============================================================
ALTER TABLE students
    -- Identitas Nasional
    ADD COLUMN IF NOT EXISTS religion               VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nationality            VARCHAR(50) DEFAULT 'WNI',
    ADD COLUMN IF NOT EXISTS birth_certificate_no   VARCHAR(50),            -- No. Akta Lahir
    ADD COLUMN IF NOT EXISTS kk_number             VARCHAR(20),             -- No. Kartu Keluarga
    ADD COLUMN IF NOT EXISTS special_needs          VARCHAR(150),           -- Kebutuhan Khusus
    ADD COLUMN IF NOT EXISTS pip_number             VARCHAR(30),            -- No. PIP / KIP
    ADD COLUMN IF NOT EXISTS pip_reason             TEXT,                   -- Alasan penerima PIP

    -- Data Sosial
    ADD COLUMN IF NOT EXISTS child_order            INTEGER,                -- Anak ke-N
    ADD COLUMN IF NOT EXISTS num_siblings           INTEGER DEFAULT 0,      -- Jumlah saudara
    ADD COLUMN IF NOT EXISTS living_with            VARCHAR(100),           -- Tinggal bersama
    ADD COLUMN IF NOT EXISTS transportation         VARCHAR(100),           -- Alat transportasi ke sekolah

    -- Alamat Detail
    ADD COLUMN IF NOT EXISTS rt_rw                  VARCHAR(10),
    ADD COLUMN IF NOT EXISTS village                VARCHAR(100),
    ADD COLUMN IF NOT EXISTS district               VARCHAR(100),
    ADD COLUMN IF NOT EXISTS city                   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS province               VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code            VARCHAR(10),

    -- Data Ayah Kandung
    ADD COLUMN IF NOT EXISTS father_name            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS father_nik             VARCHAR(20),
    ADD COLUMN IF NOT EXISTS father_birth_year      INTEGER,
    ADD COLUMN IF NOT EXISTS father_education       education_level,
    ADD COLUMN IF NOT EXISTS father_occupation      VARCHAR(150),
    ADD COLUMN IF NOT EXISTS father_income          BIGINT,                 -- Penghasilan per bulan (Rp)
    ADD COLUMN IF NOT EXISTS father_is_alive        BOOLEAN DEFAULT TRUE,

    -- Data Ibu Kandung
    ADD COLUMN IF NOT EXISTS mother_name            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mother_nik             VARCHAR(20),
    ADD COLUMN IF NOT EXISTS mother_birth_year      INTEGER,
    ADD COLUMN IF NOT EXISTS mother_education       education_level,
    ADD COLUMN IF NOT EXISTS mother_occupation      VARCHAR(150),
    ADD COLUMN IF NOT EXISTS mother_income          BIGINT,
    ADD COLUMN IF NOT EXISTS mother_is_alive        BOOLEAN DEFAULT TRUE,

    -- Data Wali (jika bukan orang tua kandung)
    ADD COLUMN IF NOT EXISTS guardian_name          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS guardian_nik           VARCHAR(20),
    ADD COLUMN IF NOT EXISTS guardian_phone         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS guardian_occupation    VARCHAR(150),
    ADD COLUMN IF NOT EXISTS guardian_relation      VARCHAR(100),           -- Hubungan dengan siswa

    -- Status Keluar
    ADD COLUMN IF NOT EXISTS exit_type              student_exit_type,
    ADD COLUMN IF NOT EXISTS exit_date              DATE,
    ADD COLUMN IF NOT EXISTS exit_reason            TEXT;

-- ============================================================
-- TABLE: spp_settings
-- Konfigurasi nominal SPP per tingkat kelas & tahun ajaran
-- ============================================================
CREATE TABLE IF NOT EXISTS spp_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year   VARCHAR(10) NOT NULL,           -- cth: 2025/2026
    grade_level     INTEGER,                        -- 10, 11, 12. NULL = berlaku semua tingkat
    class_id        UUID REFERENCES classes(id) ON DELETE CASCADE, -- NULL = berlaku semua kelas dalam tingkat tersebut
    amount          BIGINT NOT NULL,                -- Nominal SPP (Rp)
    description     TEXT,                           -- Keterangan tambahan
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: spp_payments (Menggantikan spp_billing)
-- Tagihan dan pembayaran SPP siswa
-- ============================================================
CREATE TABLE IF NOT EXISTS spp_payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    spp_setting_id      UUID REFERENCES spp_settings(id),
    academic_year       VARCHAR(10) NOT NULL,
    month               INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                INTEGER NOT NULL,
    amount              BIGINT NOT NULL,            -- Nominal SPP (snapshot saat tagihan dibuat)
    late_fee            BIGINT NOT NULL DEFAULT 0,  -- Denda keterlambatan (Rp)
    discount            BIGINT NOT NULL DEFAULT 0,  -- Diskon/keringanan (Rp)
    due_date            DATE NOT NULL,
    status              spp_payment_status NOT NULL DEFAULT 'belum_bayar',

    -- Info Pembayaran
    payment_date        DATE,                       -- Tanggal bayar yang dilaporkan siswa
    bank_name           VARCHAR(100),               -- Bank asal transfer
    account_holder      VARCHAR(255),               -- Atas nama rekening
    transaction_id      VARCHAR(100),               -- No. transaksi / referensi bank
    payment_proof_url   TEXT,                       -- URL bukti transfer

    -- Verifikasi Admin
    verified_by         UUID REFERENCES users(id),
    verified_at         TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    notes               TEXT,                       -- Catatan admin

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, month, year)
);

-- ============================================================
-- TABLE: uploaded_files
-- Manajemen file upload (foto profil, bukti bayar, dll.)
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name       VARCHAR(255) NOT NULL,          -- Nama file asli
    stored_name     VARCHAR(255) NOT NULL UNIQUE,   -- Nama file di storage
    file_path       TEXT NOT NULL,                  -- Path relatif di server
    file_type       VARCHAR(100),                   -- MIME type
    file_size       BIGINT,                         -- Ukuran file (bytes)
    entity_type     VARCHAR(50),                    -- 'teacher', 'student', 'spp_payment'
    entity_id       UUID,                           -- ID dari entitas terkait
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_spp_payments_student       ON spp_payments(student_id, year, month);
CREATE INDEX IF NOT EXISTS idx_spp_payments_status        ON spp_payments(status);
CREATE INDEX IF NOT EXISTS idx_spp_payments_year_month    ON spp_payments(year, month);
CREATE INDEX IF NOT EXISTS idx_spp_settings_year          ON spp_settings(academic_year);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_entity      ON uploaded_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_teachers_nuptk             ON teachers(nuptk) WHERE nuptk IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_nik               ON teachers(nik) WHERE nik IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_nisn              ON students(nisn) WHERE nisn IS NOT NULL;
