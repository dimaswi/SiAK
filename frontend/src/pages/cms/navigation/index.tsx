import { useEffect, useState } from "react"
import axios from "axios"
import { Link2, Navigation, Rows3, Sparkles } from "lucide-react"
import PageShell from "../../../components/PageShell"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useAppDialog } from "../../../context/AppDialogContext"
import { DataTable } from "../../../components/DataTable"
import type { ColumnDef } from "@tanstack/react-table"

const API = "http://localhost:8080/api"

type Nav = { id: string; location: string; label: string; href: string; sort_order: number; is_active: boolean }

export default function CMSNavigationIndex() {
  const dialog = useAppDialog()
  const [items, setItems] = useState<Nav[]>([])
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ location: "header", label: "", href: "/", sort_order: 0, is_active: true })

  const fetchData = async () => {
    const res = await axios.get(`${API}/cms/navigation`)
    setItems(res.data || [])
  }
  useEffect(() => { fetchData() }, [])

  const save = async () => {
    if (editingId) await axios.put(`${API}/cms/navigation/${editingId}`, form)
    else await axios.post(`${API}/cms/navigation`, form)
    await dialog.alert(editingId ? "Menu diperbarui" : "Menu dibuat")
    setEditingId(null)
    setForm({ location: "header", label: "", href: "/", sort_order: 0, is_active: true })
    fetchData()
  }

  const remove = async (id: string) => {
    const ok = await dialog.confirm("Hapus menu ini?")
    if (!ok) return
    await axios.delete(`${API}/cms/navigation/${id}`)
    fetchData()
  }
  const columns: ColumnDef<Nav>[] = [
    { accessorKey: "location", header: "Location" },
    { accessorKey: "label", header: "Label" },
    { accessorKey: "href", header: "Href" },
    { accessorKey: "sort_order", header: "Order" },
    { accessorKey: "is_active", header: "Active", cell: ({ row }) => (row.original.is_active ? "true" : "false") },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setEditingId(row.original.id); setForm({ location: row.original.location, label: row.original.label, href: row.original.href, sort_order: row.original.sort_order, is_active: row.original.is_active }) }}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(row.original.id)}>Delete</Button>
        </div>
      ),
    },
  ]
  const filtered = items.filter((x) =>
    x.location.toLowerCase().includes(search.toLowerCase()) ||
    x.label.toLowerCase().includes(search.toLowerCase()) ||
    x.href.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell title="Navigation CMS" description="Kelola struktur menu header dan footer portal publik secara rapi.">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-slate-500" /> {editingId ? "Edit Menu" : "Create Menu"}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Atur item navigasi yang muncul pada header atau footer portal publik.</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Letak Menu</Label>
                <Select value={form.location} onValueChange={(v) => setForm((p) => ({ ...p, location: v }))}>
                  <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label Menu</Label>
                <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Contoh: Profil Sekolah" />
              </div>
              <div className="space-y-2">
                <Label>Target URL</Label>
                <Input value={form.href} onChange={(e) => setForm((p) => ({ ...p, href: e.target.value }))} placeholder="/profil atau /blog" />
              </div>
              <div className="space-y-2">
                <Label>Urutan Tampil</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.is_active ? "true" : "false"} onValueChange={(v) => setForm((p) => ({ ...p, is_active: v === "true" }))}>
                  <SelectTrigger><SelectValue placeholder="Active" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={save} className="w-full">{editingId ? "Update" : "Create"}</Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" /> Preview Ringkas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Gambaran cepat item menu sebelum disimpan.</p>
            </div>
            <div className="p-4">
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Rows3 className="h-4 w-4" />
                  <span className="font-semibold uppercase">{form.location || "header"}</span> • order {form.sort_order}
                </div>
                <div className="mt-3 font-bold text-slate-800 text-sm">{form.label || "Label menu"}</div>
                <div className="mt-1.5 flex items-center gap-2 text-slate-500 font-mono text-xs">
                  <Link2 className="h-4 w-4" />
                  {form.href || "/"}
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {form.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-3">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">List Menu</h4>
            <p className="text-xs text-slate-400 mt-0.5">Kelola item menu yang sudah tersimpan.</p>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={filtered}
              pageCount={1}
              pageIndex={1}
              onPageChange={() => {}}
              searchPlaceholder="Cari location/label/href..."
              searchValue={search}
              onSearchChange={setSearch}
              totalItems={items.length}
            />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
