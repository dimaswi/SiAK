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
└── docker-compose.yml     # PostgreSQL + pgAdmin
```
