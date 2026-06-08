# SiAK - Sistem Informasi Akademik Sekolah

## Prasyarat
- Docker & Docker Compose
- Go 1.22+
- Node.js 20+

## Cara Menjalankan

### Deploy Docker Produksi / VPS
```bash
docker compose up -d --build
```

Port yang diexpose:
- Database PostgreSQL: `5434`
- Backend API: `8086`
- Admin frontend: `5176`
- Public portal: `3001`
- Reverse proxy Nginx: `80`

Nama container utama:
- `siak_database`
- `siak_backend`
- `siak_fronted`
- `siak_public`
- `siak_proxy`

Routing domain:
- `https://siak.dimaswysnu.com` -> admin frontend lewat `siak_proxy`
- `https://sekolah.dimaswysnu.com` -> public portal lewat `siak_proxy`

Akses langsung via IP dan port tetap tersedia:
- `http://IP:8086` -> backend
- `http://IP:5176` -> admin frontend
- `http://IP:3001` -> public portal
- `http://IP:5434` -> database PostgreSQL

### 1. Jalankan Database PostgreSQL via Docker
```bash
docker-compose up -d
```
- PostgreSQL akan berjalan di `localhost:5434`

### 2. Jalankan Backend (Golang)
```bash
cd backend
copy .env.example .env  # Sesuaikan isi .env jika diperlukan
go run main.go
```
- API tersedia di `http://localhost:8086`
- Health check: `http://localhost:8086/api/health`

### 3. Jalankan Frontend (React)
```bash
cd frontend
npm run dev
```
- Dashboard Admin tersedia di `http://localhost:5176`

## Login Default Admin
- **NIP**: `ADMIN001`
- **Password**: `admin123`

## Struktur Project
```
SiAK/
├── backend/               # Go (Echo Framework)
│   ├── config/            # Konfigurasi aplikasi
│   ├── database/          # Koneksi PostgreSQL
│   ├── db/migrations/     # SQL schema (di-mount ke Docker)
│   └── main.go
├── frontend/              # React (Vite + shadcn/ui)
│   └── src/
│       ├── components/    # UI Components (shadcn + custom)
│       └── lib/           # Utilities
├── public/                # Next.js Public Portal (Company + Blog + PPDB)
└── docker-compose.yml     # Full Docker stack (DB + backend + admin + public + nginx)
```

## Menjalankan Multi App (Admin + Public + Backend)
Dari root project:
```bash
npm run dev:admin
npm run dev:public
npm run dev:backend
```

- Admin app: `http://localhost:5173`
- Public portal: `http://localhost:3001`
- Backend API: `http://localhost:8086`

## Mapping Domain Produksi (Target)
- `siak.dimaswysnu.com` -> aplikasi admin (`siak_fronted`)
- `sekolah.dimaswysnu.com` -> portal publik (`siak_public`)
- `IP:8086` -> backend API (`siak_backend`)

## Reverse Proxy
- Konfigurasi Nginx host routing tersedia di `deploy/nginx/default.conf.template`
- Untuk Cloudflare Zero Trust, arahkan hostname `siak.dimaswysnu.com` ke origin host port `80`
- Untuk domain publik, arahkan `sekolah.dimaswysnu.com` ke origin host port `80`
