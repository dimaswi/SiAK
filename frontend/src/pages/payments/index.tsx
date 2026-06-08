import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { DataTable } from "../../components/DataTable"
import { billingColumns, type Billing } from "./columns"
import { useAuth } from "../../context/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Trash2, Power, PowerOff, Play } from "lucide-react"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

export default function BillingIndex() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const isStudent = user?.role === "siswa"
  const dialog = useAppDialog()

  const [data, setData] = useState<Billing[]>([])
  const [recurringData, setRecurringData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 10

  const fetchData = async (currentPage = page) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search,
      })
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterType !== "all") params.set("type", filterType)

      const endpoint = isStudent ? `${API}/billings/student` : `${API}/billings`
      const res = await axios.get(`${endpoint}?${params}`)
      
      setData(res.data.data || [])
      setTotalPages(res.data.meta?.total_pages || 1)
      setTotalItems(res.data.meta?.total_items || 0)
    } catch (err) {
      console.error("Gagal mengambil data tagihan:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecurringData = async () => {
    try {
      const res = await axios.get(`${API}/recurring-billings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setRecurringData(res.data.data || [])
    } catch (err) {
      console.error("Gagal mengambil data tagihan rutin:", err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(page)
      if (isAdmin) fetchRecurringData()
    }, 300)
    return () => clearTimeout(timer)
  }, [page, isStudent, search, filterStatus, filterType])

  const handleDeleteRecurring = async (id: string) => {
    const confirmed = await dialog.confirm("Hapus aturan tagihan rutin ini?")
    if (!confirmed) return
    try {
      await axios.delete(`${API}/recurring-billings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchRecurringData()
    } catch (err) {
      console.error(err)
      dialog.alert("Gagal menghapus aturan tagihan rutin.")
    }
  }

  const handleToggleRecurring = async (id: string) => {
    try {
      await axios.put(`${API}/recurring-billings/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchRecurringData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleForceRun = async (id: string) => {
    const input = await dialog.prompt({
      title: "Jalankan Aturan Tagihan Secara Paksa",
      message: "Sistem akan membuat tagihan untuk bulan & tahun yang ditentukan. Format: Bulan/Tahun. Contoh: 06/2026",
      placeholder: "06/2026",
    })

    if (!input) return

    const parts = input.split("/")
    if (parts.length !== 2) {
      await dialog.alert("Format salah! Harus Bulan/Tahun (contoh: 06/2026)")
      return
    }

    const month = parseInt(parts[0], 10)
    const year = parseInt(parts[1], 10)

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000) {
      await dialog.alert("Bulan atau tahun tidak valid.")
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post(`${API}/recurring-billings/${id}/force-run`, {
        month,
        year
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      await dialog.alert(res.data.message || `Berhasil membuat ${res.data.generated_count || 0} tagihan.`)
      fetchData(1)
    } catch (err: any) {
      dialog.alert(err.response?.data?.message || "Gagal menjalankan aturan")
    } finally {
      setIsLoading(false)
    }
  }

  const recurringColumns = [
    {
      header: "Judul",
      accessorKey: "title",
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.type}</p>
        </div>
      )
    },
    {
      header: "Target",
      accessorKey: "target_type",
      cell: ({ row }: any) => (
        <span className="capitalize">{row.original.target_type === "all" ? "Semua Siswa" : row.original.target_type === "class" ? "Kelas Spesifik" : "Pilih Manual"}</span>
      )
    },
    {
      header: "Nominal",
      accessorKey: "amount",
      cell: ({ row }: any) => (
        <span className="font-medium">
          Rp {Number(row.original.amount).toLocaleString("id-ID")}
        </span>
      )
    },
    {
      header: "Jatuh Tempo",
      accessorKey: "due_date_day",
      cell: ({ row }: any) => (
        <span>Tiap tanggal {row.original.due_date_day}</span>
      )
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.original.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
          {row.original.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      header: "Aksi",
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-8"
            onClick={() => handleForceRun(row.original.id)}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => handleToggleRecurring(row.original.id)}
          >
            {row.original.is_active ? <PowerOff className="h-4 w-4 text-slate-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleDeleteRecurring(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const displayData = data

  const extraFilters = !isStudent ? (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="h-9 w-40">
          <SelectValue placeholder="Semua Jenis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Jenis</SelectItem>
          <SelectItem value="SPP">SPP</SelectItem>
          <SelectItem value="UANG_GEDUNG">Uang Gedung</SelectItem>
          <SelectItem value="SERAGAM">Seragam</SelectItem>
          <SelectItem value="LAINNYA">Lainnya</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="perlu_verifikasi">Perlu Verifikasi</SelectItem>
          <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
          <SelectItem value="sebagian">Dicicil / Sebagian</SelectItem>
          <SelectItem value="lunas">Lunas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ) : null

  return (
    <PageShell
      title={isStudent ? "Tagihan Saya" : "Manajemen Tagihan & Pembayaran"}
      description={isStudent ? "Lihat riwayat dan lakukan pembayaran tagihan sekolah Anda." : "Kelola semua jenis tagihan (SPP, Uang Gedung, dll) dan transaksi."}
      actions={
        isAdmin ? (
          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="gap-2 shrink-0">
              <Link to="/payments/create">
                <Plus className="h-4 w-4" /> Buat Tagihan Baru
              </Link>
            </Button>
          </div>
        ) : null
      }
    >
      <Tabs defaultValue="riwayat" className="flex flex-col gap-4">
        {isAdmin && (
          <TabsList className="w-fit">
            <TabsTrigger value="riwayat">Daftar Tagihan</TabsTrigger>
            <TabsTrigger value="rutin">Pengaturan Tagihan Rutin</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="riwayat" className="m-0 border-none p-0 outline-none">
          <DataTable
            columns={billingColumns}
            data={displayData}
            pageSize={10}
            isLoading={isLoading}
            pageCount={totalPages}
            pageIndex={page}
            onPageChange={setPage}
            searchPlaceholder={isStudent ? "Cari nama tagihan..." : "Cari nama siswa atau NIS..."}
            searchValue={search}
            onSearchChange={handleSearchChange}
            totalItems={totalItems}
            extraFilters={extraFilters}
            emptyMessage={search ? "Tagihan tidak ditemukan" : "Belum ada tagihan"}
            emptySubMessage={
              search
                ? "Coba kata kunci lain"
                : isStudent ? "Anda belum memiliki tagihan" : `Klik "Buat Tagihan Baru" untuk membuat tagihan manual`
            }
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="rutin" className="m-0 border-none p-0 outline-none bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <DataTable
              columns={recurringColumns}
              data={recurringData}
              isLoading={isLoading}
              pageCount={1}
              pageIndex={1}
              onPageChange={() => { }}
              emptyMessage="Belum ada aturan tagihan rutin"
              emptySubMessage={`Klik "Buat Tagihan Baru" dan centang "Jadikan Tagihan Rutin" untuk membuat aturan otomatis.`}
            />
          </TabsContent>
        )}
      </Tabs>
    </PageShell>
  )
}
