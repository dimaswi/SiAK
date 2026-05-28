import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { DataTable } from "../../components/DataTable"
import { columns } from "./columns"
import type { Teacher } from "./columns"

export default function TeachersIndex() {
  const [data, setData] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchTeachers = async (currentPage: number) => {
    setIsLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:8080/api/teachers?page=${currentPage}&limit=${limit}`
      )
      setData(response.data.data || [])
      setTotalPages(response.data.meta?.total_pages || 1)
      setTotal(response.data.meta?.total || 0)
    } catch (error) {
      console.error("Gagal mengambil data guru:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers(page)
  }, [page])


  const filtered = data.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.toLowerCase().includes(search.toLowerCase())
  )

  const displayData = search ? filtered : data

  return (
    <PageShell title="Data Guru" description="
              Kelola daftar pengajar aktif di sekolah.
            " actions={<Button asChild size="sm" className="shrink-0 rounded-none-none"><Link to="/guru/create"><Plus className="h-4 w-4" />Tambah Guru</Link></Button>}>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading}
        pageCount={totalPages}
        pageIndex={page}
        onPageChange={setPage}
        searchPlaceholder="Cari nama atau NIP..."
        searchValue={search}
        onSearchChange={setSearch}
        totalItems={total}
        emptyMessage={search ? "Guru tidak ditemukan" : "Belum ada data guru"}
        emptySubMessage={search ? "Coba kata kunci lain" : "Mulai tambahkan data guru baru"}
      />
    </PageShell>
  )
}
