import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { ArrowRight, Clock3, CreditCard, GraduationCap, Users } from "lucide-react"

import { useAuth } from "../context/AuthContext"
import PageShell from "../components/PageShell"
import { Skeleton } from "../components/ui/skeleton"
import { Badge } from "../components/ui/badge"

interface DashboardStats {
  total_students: number
  total_teachers: number
  total_spp_month: number
  pending_verification: number
  display_name?: string
}

const formatRp = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value)

function KpiCell({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="border-r last:border-r-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </div>
        <Icon className="h-4 w-4 text-muted-foreground mt-1" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_teachers: 0,
    total_spp_month: 0,
    pending_verification: 0,
    display_name: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/dashboard")
        setStats(response.data)
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const role = user?.role ?? "user"
  const isGuru = role === "guru"
  const displayName = stats.display_name || user?.identifier || "-"
  const roleLabel =
    role === "kepala_sekolah"
      ? "Kepala Sekolah"
      : role === "wali_murid"
        ? "Wali Murid"
        : role.charAt(0).toUpperCase() + role.slice(1)

  const quickLinks = useMemo(
    () =>
      isGuru
        ? [
            { label: "Kelas Saya", href: "/classes", desc: "Daftar kelas yang Anda pegang sebagai wali kelas." },
            { label: "SPP Murid Kelas", href: "/spp", desc: "Status pembayaran siswa pada kelas Anda." },
          ]
        : [
            { label: "Manajemen Siswa", href: "/siswa", desc: "Data siswa aktif, profil, dan status kelas." },
            { label: "Manajemen Guru", href: "/guru", desc: "Data guru, akun, serta hak akses." },
            { label: "Pembayaran SPP", href: "/spp", desc: "Tagihan, verifikasi, dan riwayat pembayaran." },
          ],
    [isGuru]
  )

  return (
    <PageShell title="Dashboard" description="Ringkasan operasional sekolah hari ini.">
      <div className="space-y-4">
        <section className="border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Operator</p>
              <p className="text-lg font-semibold leading-tight">{displayName}</p>
            </div>
            <Badge variant="outline">{roleLabel}</Badge>
          </div>

          {isLoading ? (
            <div className={`grid ${isGuru ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
              {Array.from({ length: isGuru ? 3 : 4 }).map((_, i) => (
                <div key={i} className="border-r last:border-r-0 p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-7 w-20" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid ${isGuru ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
              <KpiCell
                label="Murid Aktif"
                value={stats.total_students.toLocaleString("id-ID")}
                hint={isGuru ? "Di kelas yang Anda pegang" : "Seluruh siswa aktif"}
                icon={GraduationCap}
              />
              {!isGuru && (
                <KpiCell
                  label="Guru Aktif"
                  value={stats.total_teachers.toLocaleString("id-ID")}
                  hint="Guru aktif mengajar"
                  icon={Users}
                />
              )}
              <KpiCell
                label="SPP Bulan Ini"
                value={formatRp(stats.total_spp_month)}
                hint="Akumulasi pembayaran lunas"
                icon={CreditCard}
              />
              <KpiCell
                label="Pending Verifikasi"
                value={stats.pending_verification.toString()}
                hint="Bukti transfer menunggu review"
                icon={Clock3}
              />
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="border bg-background">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Akses Cepat</h3>
            </div>
            <div className="divide-y">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="group flex items-center justify-between px-4 py-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <div className="border bg-background">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Status Operasional</h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Verifikasi Pembayaran</p>
                <p className="mt-1 text-sm">
                  {stats.pending_verification === 0
                    ? "Tidak ada antrian verifikasi."
                    : `${stats.pending_verification} pembayaran menunggu verifikasi.`}
                </p>
              </div>
              <div className="border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fokus Hari Ini</p>
                <p className="mt-1 text-sm">Pastikan data akademik dan pembayaran selalu sinkron dan terverifikasi.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
