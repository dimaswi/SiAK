-- ============================================================
-- SiAK - Sistem Informasi Akademik Sekolah
-- Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'kepala_sekolah', 'guru', 'siswa', 'wali_murid');
CREATE TYPE gender_type AS ENUM ('L', 'P');
CREATE TYPE spp_status AS ENUM ('belum_bayar', 'pending_verifikasi', 'lunas');
CREATE TYPE payment_method AS ENUM ('transfer_manual', 'payment_gateway');

-- ============================================================
-- TABLE: schools
-- Master data sekolah
-- ============================================================
CREATE TABLE schools (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    nss         VARCHAR(20) UNIQUE,  -- Nomor Statistik Sekolah
    address     TEXT,
    phone       VARCHAR(20),
    email       VARCHAR(100),
    logo_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: users
-- Tabel autentikasi utama (NIP/NIS sebagai identifier)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier      VARCHAR(30) NOT NULL UNIQUE, -- NIP (Guru) atau NIS (Siswa)
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE, -- Wajib ganti password pertama kali
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: teachers
-- Data detail guru dan staf
-- ============================================================
CREATE TABLE teachers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nip             VARCHAR(20) NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    gender          gender_type NOT NULL,
    birth_date      DATE,
    birth_place     VARCHAR(100),
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(100),
    photo_url       TEXT,
    subject         VARCHAR(100),  -- Mata pelajaran
    rank            VARCHAR(100),  -- Golongan/Pangkat
    join_date       DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: classes
-- Data kelas
-- ============================================================
CREATE TABLE classes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,  -- Contoh: "X IPA 1"
    grade_level     INTEGER NOT NULL,      -- 10, 11, 12
    academic_year   VARCHAR(10) NOT NULL,  -- Contoh: "2025/2026"
    homeroom_teacher_id UUID REFERENCES teachers(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: students
-- Data detail murid aktif
-- ============================================================
CREATE TABLE students (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nis             VARCHAR(20) NOT NULL UNIQUE,
    nisn            VARCHAR(20) UNIQUE,    -- Nomor Induk Siswa Nasional
    full_name       VARCHAR(255) NOT NULL,
    gender          gender_type NOT NULL,
    birth_date      DATE,
    birth_place     VARCHAR(100),
    address         TEXT,
    phone           VARCHAR(20),
    photo_url       TEXT,
    class_id        UUID REFERENCES classes(id),
    parent_name     VARCHAR(255),
    parent_phone    VARCHAR(20),
    enrollment_date DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: alumni
-- Data alumni (lulusan)
-- ============================================================
CREATE TABLE alumni (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nis             VARCHAR(20) NOT NULL UNIQUE,
    nisn            VARCHAR(20) UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    gender          gender_type NOT NULL,
    graduation_year INTEGER NOT NULL,
    last_class      VARCHAR(50),
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(100),
    current_status  VARCHAR(100),  -- Kuliah/Kerja/Wirausaha
    institution     VARCHAR(255),  -- Nama Universitas/Perusahaan
    photo_url       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: posts
-- Blog dan berita sekolah
-- ============================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) NOT NULL UNIQUE,
    content         TEXT NOT NULL,
    excerpt         TEXT,
    thumbnail_url   TEXT,
    category        VARCHAR(100),  -- Prestasi, Info Akademik, Event
    author_id       UUID REFERENCES teachers(id),
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: spp_billing
-- Tagihan SPP bulanan
-- ============================================================
CREATE TABLE spp_billing (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id),
    month           INTEGER NOT NULL,   -- 1-12
    year            INTEGER NOT NULL,
    amount          BIGINT NOT NULL,    -- dalam satuan Rupiah
    due_date        DATE NOT NULL,
    status          spp_status NOT NULL DEFAULT 'belum_bayar',
    payment_method  payment_method,
    payment_proof_url TEXT,            -- URL bukti transfer (jika manual)
    gateway_ref     VARCHAR(255),      -- Referensi dari payment gateway
    verified_by     UUID REFERENCES teachers(id),
    verified_at     TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, month, year)
);

-- ============================================================
-- TABLE: attendance
-- Presensi siswa per hari
-- ============================================================
CREATE TABLE attendance (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id  UUID NOT NULL REFERENCES students(id),
    class_id    UUID NOT NULL REFERENCES classes(id),
    teacher_id  UUID NOT NULL REFERENCES teachers(id),
    date        DATE NOT NULL,
    status      VARCHAR(10) NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha')),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- ============================================================
-- TABLE: grades
-- Nilai siswa
-- ============================================================
CREATE TABLE grades (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id  UUID NOT NULL REFERENCES students(id),
    teacher_id  UUID NOT NULL REFERENCES teachers(id),
    subject     VARCHAR(100) NOT NULL,
    grade_type  VARCHAR(20) NOT NULL CHECK (grade_type IN ('harian', 'uts', 'uas', 'tugas')),
    score       NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    semester    INTEGER NOT NULL CHECK (semester IN (1, 2)),
    academic_year VARCHAR(10) NOT NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: teaching_logs
-- Jurnal mengajar guru
-- ============================================================
CREATE TABLE teaching_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id  UUID NOT NULL REFERENCES teachers(id),
    class_id    UUID NOT NULL REFERENCES classes(id),
    date        DATE NOT NULL,
    subject     VARCHAR(100) NOT NULL,
    topic       TEXT NOT NULL,         -- Materi yang disampaikan
    activity    TEXT,                  -- Deskripsi kegiatan
    note        TEXT,                  -- Kendala/catatan khusus
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_identifier ON users(identifier);
CREATE INDEX idx_students_nis ON students(nis);
CREATE INDEX idx_teachers_nip ON teachers(nip);
CREATE INDEX idx_spp_billing_student ON spp_billing(student_id, year, month);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_grades_student ON grades(student_id, academic_year);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(is_published, published_at);

-- ============================================================
-- SEED: Default admin account
-- NIP: ADMIN001 | Password: admin123 (bcrypt)
-- ============================================================
INSERT INTO schools (name, nss, email) VALUES
('SMA Negeri 1 Contoh', '301010101001', 'admin@sman1contoh.sch.id');

-- Default admin user (password: admin123)
-- Hash ini menggunakan bcrypt cost 12
INSERT INTO users (identifier, password_hash, role, must_change_password) VALUES
('ADMIN001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBpAt28.VD.OHG', 'admin', FALSE);
