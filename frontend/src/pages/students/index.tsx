import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
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

  const fetchStudents = async (currentPage: number) => {
    setIsLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:8080/api/students?page=${currentPage}&limit=${limit}`
      )
      setData(response.data.data || [])
      setTotalPages(response.data.meta?.total_pages || 1)
      setTotal(response.data.meta?.total || 0)
    } catch (error) {
      console.error("Gagal mengambil data siswa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents(page)
  }, [page])


  const filtered = data.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.toLowerCase().includes(search.toLowerCase())
  )

  const displayData = search ? filtered : data

  return (
    <PageShell title="Data Siswa" description="
              Kelola daftar siswa aktif di sekolah.
            " actions={<Button asChild size="sm" className="shrink-0 rounded-none-none"><Link to="/siswa/create"><Plus className="h-4 w-4" />Tambah Siswa</Link></Button>}>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading}
        pageCount={totalPages}
        pageIndex={page}
        onPageChange={setPage}
        searchPlaceholder="Cari nama atau NIS..."
        searchValue={search}
        onSearchChange={setSearch}
        totalItems={total}
        emptyMessage={search ? "Siswa tidak ditemukan" : "Belum ada data siswa"}
        emptySubMessage={search ? "Coba kata kunci lain" : "Mulai tambahkan data siswa baru"}
      />
    </PageShell>
  )
}
