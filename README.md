# SiAK - Sistem Informasi Akademik Sekolah

## Prasyarat
- Docker & Docker Compose
- Go 1.22+
- Node.js 20+

## Cara Menjalankan

### 1. Jalankan Database PostgreSQL via Docker
```bash
docker-compose up -d
```
- PostgreSQL akan berjalan di `localhost:5432`
- pgAdmin (GUI DB) dapat diakses di `http://localhost:5050`
  - Email: `admin@siak.sch.id` | Password: `siak_admin`

### 2. Jalankan Backend (Golang)
```bash
cd backend
copy .env.example .env  # Sesuaikan isi .env jika diperlukan
go run main.go
```
- API tersedia di `http://localhost:8080`
- Health check: `http://localhost:8080/api/health`

### 3. Jalankan Frontend (React)
```bash
cd frontend
npm run dev
```
- Dashboard Admin tersedia di `http://localhost:5173`

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
└── docker-compose.yml     # PostgreSQL + pgAdmin
```

## Menjalankan Multi App (Admin + Public + Backend)
Dari root project:
```bash
npm run dev:admin
npm run dev:public
npm run dev:backend
```

- Admin app: `http://localhost:5173`
- Public portal: `http://localhost:3000`
- Backend API: `http://localhost:8080`

## Mapping Domain Produksi (Target)
- `admin.domain.com` -> aplikasi admin (`frontend`)
- `domain.com` / `www.domain.com` -> portal publik (`public`)
- `api.domain.com` -> backend API (`backend`)

## Contoh Reverse Proxy
- Contoh konfigurasi Nginx tersedia di [deploy/nginx/siak.conf](/e:/SiAK/deploy/nginx/siak.conf)
- Ubah `server_name` dan target `upstream` sesuai environment produksi Anda.
