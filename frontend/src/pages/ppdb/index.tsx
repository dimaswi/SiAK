import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Plus, Search, X } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { DataTable } from "../../components/DataTable"
import { columns } from "./columns"
import type { PPDBApp } from "./columns"

export default function PPDBIndex() {
  const [data, setData] = useState<PPDBApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:8080/api/ppdb/applications`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      setData(response.data || [])
    } catch (error) {
      console.error("Gagal mengambil data PPDB:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = data.filter((app) =>
    app.full_name.toLowerCase().includes(search.toLowerCase()) ||
    app.registration_no.toLowerCase().includes(search.toLowerCase())
  )

  const displayData = search ? filtered : data

  return (
    <PageShell
      title="Manajemen PPDB"
      description="Kelola pendaftar PPDB, verifikasi berkas, dan konversi ke siswa."
      actions={
        <Button size="sm" onClick={() => navigate("/ppdb/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pendaftar
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau no. pendaftaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-9 shadow-xs bg-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">
            {displayData.length} total data
          </p>
        </div>

        <DataTable
          columns={columns}
          data={displayData}
          isLoading={isLoading}
          pageCount={1}
          pageIndex={page}
          onPageChange={setPage}
          emptyMessage={search ? "Pendaftar tidak ditemukan" : "Belum ada data pendaftar PPDB"}
          emptySubMessage={search ? "Coba kata kunci lain" : "Mulai tambahkan data pendaftar baru"}
        />
      </div>
    </PageShell>
  )
}
