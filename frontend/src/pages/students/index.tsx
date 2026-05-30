import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Plus, Search, X } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { DataTable } from "../../components/DataTable"
import { columns } from "./columns"
import type { Student } from "./columns"

export default function StudentsIndex() {
  const [data, setData] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const fetchStudents = async (currentPage: number) => {
    setIsLoading(true)
    try {
      const response = await axios.get(`http://localhost:8080/api/students?page=${currentPage}&limit=${limit}`)
      setData(response.data.data || [])
      setTotalPages(response.data.meta?.total_pages || 1)
      setTotal(response.data.meta?.total || 0)
    } catch (error) {
      console.error("Gagal mengambil data siswa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchStudents(page) }, [page])

  const filtered = data.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.toLowerCase().includes(search.toLowerCase())
  )
  const displayData = search ? filtered : data

  return (
    <PageShell
      title="Data Siswa"
      description="Kelola daftar siswa aktif di sekolah."
      actions={
        <Button size="sm" onClick={() => navigate("/siswa/create")}>
          <Plus className="mr-2 h-4 w-4" />Tambah Siswa
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9 pr-9 shadow-xs bg-transparent" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{total} total data</p>
        </div>
        <DataTable columns={columns} data={displayData} isLoading={isLoading} pageCount={totalPages} pageIndex={page} onPageChange={setPage} pageSize={limit}
          emptyMessage={search ? "Siswa tidak ditemukan" : "Belum ada data siswa"} emptySubMessage={search ? "Coba kata kunci lain" : "Mulai tambahkan data siswa baru"} />
      </div>
    </PageShell>
  )
}
