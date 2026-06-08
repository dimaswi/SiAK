import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Plus, Search, X } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { DataTable } from "../../components/DataTable"
import { columns } from "./columns"
import type { Teacher } from "./columns"

export default function TeachersIndex() {
  const [data, setData] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const fetchTeachers = async (currentPage: number) => {
    setIsLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:8080/api/teachers?page=${currentPage}&limit=${limit}`
      )
      setData(response.data.data || [])
      setTotalPages(response.data.meta?.total_pages || 1)
      setTotal(response.data.meta?.total_items || 0)
    } catch (error) {
      console.error("Gagal mengambil data guru:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchTeachers(page) }, [page, limit])

  const filtered = data.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.toLowerCase().includes(search.toLowerCase())
  )
  const displayData = search ? filtered : data

  return (
    <PageShell
      title="Data Guru"
      description="Kelola daftar pengajar aktif di sekolah."
      actions={
        <Button size="sm" onClick={() => navigate("/guru/create")}>
          <Plus className="mr-2 h-4 w-4" />Tambah Guru
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama atau NIP..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9 pr-9 shadow-xs bg-transparent" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{total} total data</p>
        </div>
        <DataTable columns={columns} data={displayData} isLoading={isLoading} pageCount={totalPages} pageIndex={page} onPageChange={setPage} pageSize={limit} onPageSizeChange={setLimit} emptyMessage={search ? "Guru tidak ditemukan" : "Belum ada data guru"} emptySubMessage={search ? "Coba kata kunci lain" : "Mulai tambahkan data guru baru"} />
      </div>
    </PageShell>
  )
}
