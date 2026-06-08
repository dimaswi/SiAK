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
  total_payments_month: number
  pending_verification: number
  display_name?: string
  student_total_billings?: number
  student_total_paid?: number
  student_total_unpaid?: number
}

const formatRp = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value)

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_teachers: 0,
    total_payments_month: 0,
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
  const isSiswa = role === "siswa" || role === "wali_murid"
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
      isSiswa
        ? [
            { label: "Tagihan Saya", href: "/payments", desc: "Lihat dan bayar tagihan sekolah Anda." },
            { label: "Riwayat Transaksi", href: "/payments", desc: "Periksa status pembayaran Anda." },
          ]
        : isGuru
        ? [
            { label: "Kelas Saya", href: "/classes", desc: "Daftar kelas yang Anda pegang sebagai wali kelas." },
            { label: "Tagihan Murid Kelas", href: "/payments", desc: "Status pembayaran siswa pada kelas Anda." },
          ]
        : [
            { label: "Manajemen Siswa", href: "/siswa", desc: "Data siswa aktif, profil, dan status kelas." },
            { label: "Guru & Staff", href: "/guru", desc: "Kelola data tenaga pendidik." },
            { label: "Keuangan & Tagihan", href: "/payments", desc: "Pantau SPP dan pembayaran." },
          ],
    [isSiswa, isGuru]
  )

  return (
    <PageShell title="Dashboard" description="Ringkasan operasional sekolah hari ini.">
      <div className="space-y-6">
        {/* Operator Info */}
        <div className="bg-card rounded-xl border shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Operator</p>
            <p className="text-lg font-semibold leading-tight">{displayName}</p>
          </div>
          <Badge variant="outline">{roleLabel}</Badge>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className={`grid gap-4 ${isGuru ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            {Array.from({ length: isGuru ? 3 : 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border shadow-sm p-5 h-[120px] space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isSiswa ? (
              <>
                <KpiCard label="Total Tagihan" value={formatRp(stats.student_total_billings || 0)} hint="Keseluruhan tagihan Anda" icon={CreditCard} iconBg="bg-blue-100" iconColor="text-blue-600" />
                <KpiCard label="Total Terbayar" value={formatRp(stats.student_total_paid || 0)} hint="Jumlah yang sudah dilunasi" icon={GraduationCap} iconBg="bg-green-100" iconColor="text-green-600" />
                <KpiCard label="Sisa Belum Dibayar" value={formatRp(stats.student_total_unpaid || 0)} hint="Kekurangan tagihan aktif" icon={ArrowRight} iconBg="bg-red-100" iconColor="text-red-600" />
                <KpiCard label="Menunggu Verifikasi" value={`${stats.pending_verification || 0} Trx`} hint="Sedang dicek oleh Admin" icon={Clock3} iconBg="bg-amber-100" iconColor="text-amber-600" />
              </>
            ) : (
              <>
                <KpiCard label="Total Siswa" value={stats.total_students.toString()} hint="Siswa aktif saat ini" icon={GraduationCap} iconBg="bg-blue-100" iconColor="text-blue-600" />
                <KpiCard label="Total Guru" value={stats.total_teachers.toString()} hint="Tenaga pendidik aktif" icon={Users} iconBg="bg-purple-100" iconColor="text-purple-600" />
                <KpiCard label="Pembayaran Bulan Ini" value={formatRp(stats.total_payments_month)} hint="Pemasukan terverifikasi (Di luar diskon)" icon={CreditCard} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
                <KpiCard label="Verifikasi Tertunda" value={`${stats.pending_verification} Trx`} hint="Membutuhkan persetujuan" icon={Clock3} iconBg="bg-amber-100" iconColor="text-amber-600" />
              </>
            )}
          </div>
        )}

        {/* Quick Access + Status */}
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3">
              <h3 className="text-sm font-semibold">Akses Cepat</h3>
            </div>
            <div className="divide-y">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="group flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3">
              <h3 className="text-sm font-semibold">Status Operasional</h3>
            </div>
            <div className="space-y-3 p-5">
              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Verifikasi Pembayaran</p>
                <p className="mt-1 text-sm font-medium">
                  {stats.pending_verification === 0
                    ? "Tidak ada antrian verifikasi."
                    : `${stats.pending_verification} pembayaran menunggu verifikasi.`}
                </p>
              </div>
              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fokus Hari Ini</p>
                <p className="mt-1 text-sm">Pastikan data akademik dan pembayaran selalu sinkron dan terverifikasi.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
