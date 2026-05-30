import { useEffect, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import PageShell from "../../../components/PageShell"
import { Button } from "../../../components/ui/button"
import { useAppDialog } from "../../../context/AppDialogContext"
import { DataTable } from "../../../components/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2Icon, Edit2Icon, Eye, Loader, Trash } from "lucide-react"

const API = "http://localhost:8080/api"

type Item = { id: string; key: string; title: string; is_published: boolean }

export default function CMSCompanyIndex() {
  const dialog = useAppDialog()
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    const res = await axios.get(`${API}/cms/pages`)
    setItems(res.data || [])
  }

  useEffect(() => { fetchData() }, [])

  const remove = async (id: string) => {
    const ok = await dialog.confirm("Hapus halaman profile ini?")
    if (!ok) return
    await axios.delete(`${API}/cms/pages/${id}`)
    fetchData()
  }
  const columns: ColumnDef<Item>[] = [
    { accessorKey: "key", header: "Key" },
    { accessorKey: "title", header: "Judul" },
    {
      accessorKey: "is_published",
      header: "Status",
      cell: ({ row }) => row.original.is_published ? <CheckCircle2Icon className="h-4 w-4 text-green-500"></CheckCircle2Icon> : <Loader className="h-4 w-4"></Loader>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" asChild><Link to={`/cms/company/${row.original.id}`}>
            <Eye className="h-4 w-4"></Eye>
          </Link></Button>
          <Button size="icon" variant="outline" asChild><Link to={`/cms/company/${row.original.id}/edit`}>
            <Edit2Icon className="h-4 w-4 text-yellow-600"></Edit2Icon>
          </Link></Button>
          <Button size="icon" variant="outline" onClick={() => remove(row.original.id)}>
            <Trash className="h-4 w-4 text-red-600"></Trash>
          </Button>
        </div>
      ),
    },
  ]
  const filtered = items.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()) || x.key.toLowerCase().includes(search.toLowerCase()))

  return (
    <PageShell title="Company Profile CMS" description="Daftar halaman profile." actions={<Button asChild size="sm" className="shrink-0"><Link to="/cms/company/create">Create Halaman</Link></Button>}>
      <DataTable
        columns={columns}
        data={filtered}
        pageCount={1}
        pageIndex={1}
        onPageChange={() => { }}
        searchPlaceholder="Cari key/judul..."
        searchValue={search}
        onSearchChange={setSearch}
        totalItems={items.length}
      />
    </PageShell>
  )
}
