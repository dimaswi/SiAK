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

type Post = { id: string; title: string; slug: string; status: string }

export default function CMSBlogIndex() {
  const dialog = useAppDialog()
  const [items, setItems] = useState<Post[]>([])
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    const res = await axios.get(`${API}/cms/posts`)
    setItems(res.data || [])
  }
  useEffect(() => { fetchData() }, [])

  const remove = async (id: string) => {
    const ok = await dialog.confirm("Hapus post ini?")
    if (!ok) return
    await axios.delete(`${API}/cms/posts/${id}`)
    fetchData()
  }
  const columns: ColumnDef<Post>[] = [
    { accessorKey: "title", header: "Judul" },
    { accessorKey: "slug", header: "Slug" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => row.original.status === "published" ? <CheckCircle2Icon className="h-4 w-4 text-green-500"></CheckCircle2Icon> : <Loader className="h-4 w-4"></Loader>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" asChild><Link to={`/cms/blog/${row.original.id}`}>
            <Eye className="h-4 w-4"></Eye>
          </Link></Button>
          <Button size="icon" variant="outline" asChild><Link to={`/cms/blog/${row.original.id}/edit`}>
            <Edit2Icon className="h-4 w-4 text-yellow-600"></Edit2Icon>
          </Link></Button>
          <Button size="icon" variant="outline" onClick={() => remove(row.original.id)}>
            <Trash className="h-4 w-4 text-red-600"></Trash>
          </Button>
        </div>
      ),
    },
  ]
  const filtered = items.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()) || x.slug.toLowerCase().includes(search.toLowerCase()))

  return (
    <PageShell title="Blog CMS" description="Daftar artikel blog." actions={<Button asChild size="sm" className="shrink-0"><Link to="/cms/blog/create">Create Post</Link></Button>}>
      <DataTable
        columns={columns}
        data={filtered}
        pageCount={1}
        pageIndex={1}
        onPageChange={() => { }}
        searchPlaceholder="Cari judul/slug..."
        searchValue={search}
        onSearchChange={setSearch}
        totalItems={items.length}
      />
    </PageShell>
  )
}
