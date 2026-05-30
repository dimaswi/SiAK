-- ============================================================
-- Migration 003: CMS Internal for Public Portal
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_post_status') THEN
        CREATE TYPE cms_post_status AS ENUM ('draft', 'published');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS cms_pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key             VARCHAR(80) NOT NULL UNIQUE,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL DEFAULT '',
    meta_title      VARCHAR(255),
    meta_description TEXT,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_posts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(255) NOT NULL UNIQUE,
    excerpt          TEXT NOT NULL DEFAULT '',
    content          TEXT NOT NULL DEFAULT '',
    cover_image_url  TEXT,
    status           cms_post_status NOT NULL DEFAULT 'draft',
    published_at     TIMESTAMPTZ,
    meta_title       VARCHAR(255),
    meta_description TEXT,
    created_by       UUID REFERENCES users(id),
    updated_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_navigation_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location        VARCHAR(40) NOT NULL, -- header / footer
    label           VARCHAR(120) NOT NULL,
    href            VARCHAR(255) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_nav_location ON cms_navigation_items(location, sort_order);
