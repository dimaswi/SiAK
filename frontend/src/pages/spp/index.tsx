import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus, RefreshCw, CheckCircle2, Clock, XCircle, CreditCard, AlertCircle } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { DataTable } from "../../components/DataTable"
import { sppPaymentColumns, type SppPayment } from "./columns"
import { useAuth } from "../../context/AuthContext"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

interface Stats {
  lunas: number
  pending: number
  belum_bayar: number
  total_collected: number
}

interface StudentSummary {
  total_billed: number
  total_paid: number
  total_pending: number
  arrears: number
  paid_count: number
  unpaid_count: number
}

export default function SppIndex() {
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdmin = user?.role === "admin"
  const isStudent = user?.role === "siswa"

  const [data, setData] = useState<SppPayment[]>([])
  
  // Global Stats (Admin/Teacher)
  const [stats, setStats] = useState<Stats>({ lunas: 0, pending: 0, belum_bayar: 0, total_collected: 0 })
  
  // Student Specific Stats
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 15

  const fetchData = async (currentPage = page) => {
    setIsLoading(true)
    try {
      if (isStudent) {
        const sppRes = await axios.get(`${API}/spp/student/me`)
        setData(sppRes.data.payments || [])
        setStudentSummary(sppRes.data.summary)
        setTotalItems(sppRes.data.payments?.length || 0)
      } else {
        // Admin or Teacher fetching global paginated data
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          search,
          month: filterMonth,
          year: filterYear,
        })
        if (filterStatus !== "all") params.set("status", filterStatus)

        const [paymentsRes, statsRes] = await Promise.all([
          axios.get(`${API}/spp/payments?${params}`),
          axios.get(`${API}/spp/payments/stats?month=${filterMonth}&year=${filterYear}`),
        ])
        setData(paymentsRes.data.data || [])
        setTotalPages(paymentsRes.data.meta?.total_pages || 1)
        setTotalItems(paymentsRes.data.meta?.total_items || 0)
        setStats(statsRes.data)
      }
    } catch (err) {
      console.error("Gagal mengambil data SPP:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData(page) }, [page, isStudent])

  // Re-fetch from page 1 when filters change (Only for Admin/Teacher)
  useEffect(() => {
    if (!isStudent) {
      setPage(1)
      fetchData(1)
    }
  }, [filterStatus, filterMonth, filterYear])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (!isStudent) setPage(1)
  }

  const handleGenerate = async () => {
    const m = Number(filterMonth)
    const y = Number(filterYear)
    const dueDate = `${y}-${String(m).padStart(2, "0")}-10`
    const academicYear = m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`

    const confirmed = await dialog.confirm(`Generate tagihan SPP untuk bulan ${MONTHS[m - 1]} ${y} untuk semua siswa aktif?`)
    if (!confirmed) return

    setIsGenerating(true)
    try {
      const res = await axios.post(`${API}/spp/payments/generate`, {
        academic_year: academicYear, month: m, year: y, due_date: dueDate,
      })
      await dialog.alert(res.data.message)
      fetchData(1)
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal generate tagihan")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

  // Extra filters rendered alongside DataTable's search (Only for Admin/Teacher)
  const extraFilters = !isStudent ? (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={filterMonth} onValueChange={setFilterMonth}>
        <SelectTrigger className="h-9 w-36">
          <SelectValue placeholder="Bulan" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterYear} onValueChange={setFilterYear}>
        <SelectTrigger className="h-9 w-28">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036].map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="h-9 w-52">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
          <SelectItem value="pending_verifikasi">Menunggu Verifikasi</SelectItem>
          <SelectItem value="lunas">Lunas</SelectItem>
          <SelectItem value="bebas_spp">Bebas SPP</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ) : null

  return (
    <PageShell
      title={isStudent ? "Tagihan SPP Saya" : "Manajemen Pembayaran SPP"}
      description={isStudent ? "Lihat riwayat dan lakukan pembayaran SPP bulanan Anda." : "Kelola tagihan dan pembayaran SPP siswa."}
      actions={
        isAdmin ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/spp/settings">Setting Nominal</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />
              }
              Generate Bulan Ini
            </Button>
            <Button size="sm" asChild className="gap-2 shrink-0">
              <Link to="/spp/create">
                <Plus className="h-4 w-4" /> Tagihan Manual
              </Link>
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        {/* Stats Cards */}
        {isStudent && studentSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Tunggakan</p>
                  <p className="text-lg font-bold text-red-600">{formatRp(studentSummary.arrears)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Belum Lunas</p>
                  <p className="text-lg font-bold">{studentSummary.unpaid_count} Bulan</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sudah Lunas</p>
                  <p className="text-lg font-bold">{studentSummary.paid_count} Bulan</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !isStudent ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lunas</p>
                  <p className="text-lg font-bold">{stats.lunas}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Menunggu Verifikasi</p>
                  <p className="text-lg font-bold">{stats.pending}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Belum Bayar</p>
                  <p className="text-lg font-bold">{stats.belum_bayar}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Terkumpul</p>
                  <p className="text-sm font-bold">{formatRp(stats.total_collected)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* DataTable */}
        <DataTable
          columns={sppPaymentColumns}
          data={data}
          isLoading={isLoading}
          pageCount={isStudent ? 1 : totalPages} // Students see all their bills without pagination
          pageIndex={isStudent ? 1 : page}
          onPageChange={setPage}
          searchPlaceholder={isStudent ? "Cari bulan atau tahun..." : "Cari nama siswa atau NIS..."}
          searchValue={search}
          onSearchChange={handleSearchChange}
          totalItems={totalItems}
          extraFilters={extraFilters}
          emptyMessage={search ? "Tagihan tidak ditemukan" : "Belum ada tagihan SPP"}
          emptySubMessage={
            search
              ? "Coba kata kunci lain"
              : isStudent ? "Anda belum memiliki tagihan SPP" : `Gunakan tombol "Generate Bulan Ini" untuk membuat tagihan otomatis`
          }
        />
      </div>
    </PageShell>
  )
}
