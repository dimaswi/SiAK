## Rencana Pemisahan Portal Publik Next.js + CMS Internal

### Summary
Kita pisahkan aplikasi menjadi 2 surface:
- **Portal Publik**: Next.js App Router (`/public`) untuk company profile + blog + halaman PPDB publik.
- **Portal Admin**: aplikasi existing tetap untuk operasional sekolah, sekaligus ditambah **modul CMS internal** (bukan pakai Strapi/Payload/Sanity) untuk mengelola konten portal publik.

Target akses:
- `admin.domain.com` → portal admin existing.
- `domain.com` (atau `www.domain.com`) → portal public Next.js.

### Key Changes
1. **Struktur repo & app separation**
- Tambah folder baru `public/` berisi Next.js (App Router + TypeScript).
- `frontend/` (admin existing) dan `backend/` tetap dipertahankan, tidak digabung.
- Tambah root script orchestration untuk dev/build multi-app (admin + public + backend).

2. **CMS internal di admin existing (custom)**
- Tambah modul manajemen konten di admin:
  - `Pages` (company profile sections: hero, tentang, visi-misi, kontak).
  - `Posts` (blog article: title, slug, excerpt, content, cover, status draft/published, published_at).
  - `Menu/Navigation` (navigasi header/footer portal public).
- Tambah endpoint backend CMS (CRUD + publish workflow + slug uniqueness + public-read endpoint).
- Role akses CMS:
  - `admin` dan `kepala_sekolah` bisa kelola konten.
  - role lain read/no-access sesuai policy existing.

3. **Portal public Next.js**
- Halaman awal:
  - Home/profile company (mengambil data dari API CMS).
  - Blog list + blog detail by slug.
  - PPDB public entrypoint (form pendaftaran, cek status) terhubung ke API backend yang sudah direncanakan.
- Data fetching:
  - Public pages pakai SSR/ISR-friendly fetch dari endpoint public CMS.
  - Slug routes untuk SEO (`/blog/[slug]`).
- Konsistensi desain:
  - Style system terpisah dari admin; fokus branding publik, tidak mewarisi layout dashboard admin.

4. **API surface & integrasi**
- Backend expose dua kelompok endpoint:
  - **CMS Admin API** (protected via JWT + role check).
  - **CMS Public API** (published-only).
- Endpoint PPDB public tetap di backend existing, di-consume oleh Next.js public.
- CORS/env domain dipisah untuk `admin.*` dan `www.*`.

5. **Deploy & domain mapping**
- Admin deploy ke subdomain `admin.domain.com`.
- Public Next.js deploy ke `domain.com` / `www.domain.com`.
- Backend API di domain API terpisah (mis. `api.domain.com`) atau private upstream + reverse proxy; dipilih konsisten untuk kedua app.
- Reverse proxy rule:
  - host `admin.*` → `frontend` admin app.
  - host `www/*` atau root domain → Next.js public app.
  - host `api.*` → backend Go.

### Test Plan
1. **Separation & routing**
- `admin.domain.com` membuka app admin lama tanpa regressions.
- `domain.com` membuka Next.js public.
- Tidak ada path collision antar app.

2. **CMS workflow**
- Admin create/edit/publish/unpublish page & post berhasil.
- Slug unik tervalidasi; draft tidak tampil di endpoint public.
- Navigation update dari admin langsung tercermin di portal public.

3. **Public portal behavior**
- Home/profile tampil dari CMS.
- Blog list/detail render benar, slug valid, 404 untuk slug tidak ada.
- SEO basics muncul (title/meta/og per page/post).

4. **PPDB public integration**
- Form PPDB dari portal public submit ke backend sukses.
- Cek status pendaftaran dari portal public berhasil.
- Error handling (validasi/form gagal) tampil jelas.

### Assumptions
- CMS dibangun **custom di admin existing**, bukan third-party CMS.
- Next.js public hanya consume API backend; tidak direct DB access.
- Fase awal belum mencakup media processing kompleks/CDN image pipeline lanjutan (cukup upload + URL dari backend existing).
