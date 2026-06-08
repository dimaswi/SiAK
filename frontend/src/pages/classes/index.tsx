import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus, Users, LayoutDashboard, Trash, EditIcon } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { DataTable } from "../../components/DataTable"
import { useAuth } from "../../context/AuthContext"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

interface ClassItem {
  id: string
  name: string
  grade_level: number
  academic_year: string
  homeroom_teacher_name: string
  student_count: number
}

export default function ClassesIndex() {
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdmin = user?.role === "admin" || user?.role === "kepala_sekolah"

  const [data, setData] = useState<ClassItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 15

  const fetchData = async (currentPage = page) => {
    setIsLoading(true)
    try {
      const res = await axios.get(`${API}/classes?page=${currentPage}&limit=${limit}&search=${search}`)
      setData(res.data.data || [])
      setTotalPages(res.data.meta?.total_pages || 1)
      setTotalItems(res.data.meta?.total_items || 0)
    } catch (err) {
      console.error("Gagal mengambil data kelas:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData(page)
  }, [page])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await dialog.confirm(`Hapus kelas ${name}? Data siswa di dalamnya tidak akan terhapus, hanya class_id-nya akan menjadi kosong.`)
    if (!confirmed) return
    try {
      await axios.delete(`${API}/classes/${id}`)
      fetchData(page)
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal menghapus kelas")
    }
  }

  const columns = [
    {
      id: "name",
      header: "Nama Kelas",
      cell: ({ row }: any) => (
        <Link to={`/classes/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "grade_level",
      header: "Tingkat",
      cell: ({ row }: any) => <span className="text-sm">Kelas {row.original.grade_level}</span>,
    },
    {
      id: "academic_year",
      header: "Tahun Ajaran",
      cell: ({ row }: any) => <span className="text-sm">{row.original.academic_year}</span>,
    },
    {
      id: "homeroom_teacher",
      header: "Wali Kelas",
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">{row.original.homeroom_teacher_name || "—"}</span>
      ),
    },
    {
      id: "student_count",
      header: "Jumlah Siswa",
      cell: ({ row }: any) => (
        <span className="text-sm font-medium">{row.original.student_count || 0} Siswa</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }: any) => {
        if (!isAdmin) return null
        const cls = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/classes/${cls.id}/edit`}>
                <EditIcon className="h-4 w-4 text-yellow-600"></EditIcon>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(cls.id, cls.name)}
            >
              <Trash className="h-4 w-4"></Trash>
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PageShell
      title="Manajemen Kelas"
      description="Kelola daftar kelas, wali kelas, dan siswa per kelas."
      actions={
        isAdmin ? (
          <Button size="sm" asChild className="gap-2 shrink-0">
            <Link to="/classes/create">
              <Plus className="h-4 w-4" /> Tambah Kelas
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Kelas</p>
              <p className="text-lg font-bold text-slate-800">{totalItems}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Siswa Terdaftar di Kelas</p>
              <p className="text-lg font-bold text-slate-800">
                {data.reduce((acc, curr) => acc + (curr.student_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          pageCount={totalPages}
          pageIndex={page}
          onPageChange={setPage}
          searchPlaceholder="Cari nama kelas..."
          searchValue={search}
          onSearchChange={handleSearchChange}
          totalItems={totalItems}
          emptyMessage={search ? "Kelas tidak ditemukan" : "Belum ada kelas"}
        />
      </div>
    </PageShell>
  )
}
