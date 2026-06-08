import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "../../components/PageShell"
import { DataTable } from "../../components/DataTable"
import { Button } from "../../components/ui/button"
import { Plus, Trash2, Power, PowerOff } from "lucide-react"
import { Link } from "react-router-dom"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

export default function RecurringBillings() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const dialog = useAppDialog()

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/recurring-billings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setData(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm("Hapus aturan tagihan rutin ini?")
    if (!confirmed) return
    try {
      await axios.delete(`${API}/recurring-billings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchData()
    } catch (err) {
      console.error(err)
      dialog.alert("Gagal menghapus aturan tagihan rutin.")
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await axios.put(`${API}/recurring-billings/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
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
        <span className="capitalize">{row.original.target_type === "all" ? "Semua Siswa" : "Kelas Spesifik"}</span>
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
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => handleToggle(row.original.id)}
          >
            {row.original.is_active ? <PowerOff className="h-4 w-4 mr-1 text-slate-500" /> : <Power className="h-4 w-4 mr-1 text-emerald-500" />}
            {row.original.is_active ? "Matikan" : "Aktifkan"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <PageShell
      title="Tagihan Rutin"
      description="Kelola aturan tagihan rutin yang di-generate setiap bulannya."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="gap-2 shrink-0">
            <Link to="/recurring-billings/create">
              <Plus className="h-4 w-4" /> Buat Aturan Baru
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          pageCount={1}
          pageIndex={1}
          onPageChange={() => {}}
        />
      </div>
    </PageShell>
  )
}
