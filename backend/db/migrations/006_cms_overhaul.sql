-- Migration 006: CMS Overhaul

-- Drop old cms_pages table
DROP TABLE IF EXISTS cms_pages;

-- New flat site config (1 row per site)
CREATE TABLE IF NOT EXISTS cms_site_config (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Branding
    school_name     VARCHAR(255) NOT NULL DEFAULT 'SMAN 1 KELAS',
    school_tagline  VARCHAR(255) DEFAULT 'CRAFTING DIGITAL EXCELLENCE',
    logo_url        TEXT DEFAULT '',
    
    -- Hero Section
    hero_title      VARCHAR(500) DEFAULT 'CRAFTING DIGITAL EXCELLENCE',
    hero_description TEXT DEFAULT 'We help visionary brands and businesses transform their ideas into innovative digital solutions, experiences, and platforms. Nordic Digital combines creativity, strategy, and technology for modern success.',
    hero_cta_1_text VARCHAR(100) DEFAULT 'Daftar PPDB',
    hero_cta_1_url  VARCHAR(255) DEFAULT '/ppdb',
    hero_cta_2_text VARCHAR(100) DEFAULT 'Lihat Artikel',
    hero_cta_2_url  VARCHAR(255) DEFAULT '/blog',
    
    -- Dynamic Stats Labels
    stat_1_label    VARCHAR(100) DEFAULT 'Total Siswa',
    stat_2_label    VARCHAR(100) DEFAULT 'Total Guru',
    stat_3_label    VARCHAR(100) DEFAULT 'Pendaftar PPDB',
    
    -- About Section
    about_title     VARCHAR(500) DEFAULT 'Tentang Sekolah Kami',
    about_content   TEXT DEFAULT '<p>Company profile kami susun agar orang tua, calon siswa, dan mitra bisa memahami nilai, arah, dan kualitas sekolah secara cepat.</p>',
    
    -- Programs (Cards)
    program_1_title VARCHAR(200) DEFAULT 'Kurikulum Unggulan',
    program_1_desc  TEXT DEFAULT 'Program akademik yang dirancang untuk mempersiapkan siswa.',
    program_2_title VARCHAR(200) DEFAULT 'Ekstrakurikuler',
    program_2_desc  TEXT DEFAULT 'Beragam kegiatan pengembangan bakat dan minat.',
    program_3_title VARCHAR(200) DEFAULT 'Bimbingan Karakter',
    program_3_desc  TEXT DEFAULT 'Pembentukan karakter melalui program mentoring.',
    program_4_title VARCHAR(200) DEFAULT 'Fasilitas Modern',
    program_4_desc  TEXT DEFAULT 'Lingkungan belajar yang nyaman dan fasilitas tinggi.',
    
    -- Footer
    footer_description TEXT DEFAULT 'Portal resmi sekolah untuk informasi akademik, pendaftaran, dan kegiatan.',
    footer_address  TEXT DEFAULT 'Jl. Pendidikan No. 1, Jakarta',
    footer_phone    VARCHAR(50) DEFAULT '+62 812 3456 7890',
    footer_email    VARCHAR(100) DEFAULT 'info@sekolah.sch.id',
    
    -- Meta
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 1 default row
INSERT INTO cms_site_config (school_name, school_tagline)
VALUES ('SMAN 1 KELAS', 'CRAFTING DIGITAL EXCELLENCE')
ON CONFLICT DO NOTHING;
