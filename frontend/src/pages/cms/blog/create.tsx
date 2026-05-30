import { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ImagePlus, Newspaper, ScanSearch, Sparkles } from "lucide-react"
import PageShell from "../../../components/PageShell"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useAppDialog } from "../../../context/AppDialogContext"
import JoditEditor from "jodit-react"

const API = "http://localhost:8080/api"
const ASSET_BASE = "http://localhost:8080"

export default function CMSBlogCreate() {
  const navigate = useNavigate()
  const dialog = useAppDialog()
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", cover_image_url: "", status: "draft", meta_title: "", meta_description: "" })
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingInline, setUploadingInline] = useState(false)

  const uploadImage = async (file: File) => {
    const fd = new FormData()
    fd.append("image", file)
    const res = await axios.post(`${API}/upload/cms-image`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data?.image_url as string
  }

  const onUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadingCover(true)
    try {
      const path = await uploadImage(f)
      setForm((p) => ({ ...p, cover_image_url: path }))
      await dialog.alert("Cover image berhasil diupload")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Upload cover image gagal")
    } finally {
      setUploadingCover(false)
      e.target.value = ""
    }
  }

  const onUploadInline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadingInline(true)
    try {
      const path = await uploadImage(f)
      setForm((p) => ({ ...p, content: `${p.content}\n<img src="${ASSET_BASE}${path}" alt="${f.name}" />` }))
      await dialog.alert("Gambar berhasil diupload dan ditambahkan ke content")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Upload gambar konten gagal")
    } finally {
      setUploadingInline(false)
      e.target.value = ""
    }
  }

  const submit = async () => {
    try {
      await axios.post(`${API}/cms/posts`, form)
      await dialog.alert("Post berhasil dibuat")
      navigate("/cms/blog")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal membuat post")
    }
  }

  return (
    <PageShell
      title="Create Blog Post"
      description="Tulis artikel blog sekolah dengan cover, konten, dan metadata publikasi."
      backButton={
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
          <Link to="/cms/blog"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-5 py-3 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Naskah Artikel</h3>
            <p className="text-xs text-slate-400 ml-2">Isi artikel utama yang akan tampil di halaman blog publik.</p>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-700">Judul Artikel</Label>
              <Input 
                placeholder="Contoh: Prestasi Siswa di Olimpiade Nasional" 
                value={form.title} 
                onChange={(e) => {
                  const val = e.target.value;
                  const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  setForm((p) => ({ ...p, title: val, slug }))
                }} 
                className="shadow-xs"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700">Slug</Label>
                <Input placeholder="prestasi-siswa-olimpiade" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Status Publikasi</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih status post" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Excerpt</Label>
              <textarea className="w-full min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs" placeholder="Ringkasan singkat artikel untuk daftar blog..." value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Konten Artikel</Label>
              <JoditEditor
                value={form.content}
                config={{ minHeight: 340, placeholder: "Tulis isi artikel lengkap, paragraf berita, kutipan, dan informasi pendukung..." }}
                onBlur={(newContent) => setForm((p) => ({ ...p, content: newContent }))}
              />
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ImagePlus className="h-4 w-4" />
                Sisipkan gambar ke artikel
              </div>
              <p className="mt-1 text-xs text-slate-500">Gambar akan ditambahkan otomatis ke area konten.</p>
              <div className="mt-3 space-y-1">
                <Input type="file" accept="image/*" onChange={onUploadInline} className="shadow-xs" />
                <p className="text-xs text-muted-foreground">{uploadingInline ? "Sedang upload gambar konten..." : "Pilih JPG, PNG, atau WebP."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b px-5 py-3 flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Media & Cover</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Cover Image URL</Label>
                <Input placeholder="/uploads/cms/..." value={form.cover_image_url} onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))} className="shadow-xs" />
              </div>
              {form.cover_image_url ? <img src={`${ASSET_BASE}${form.cover_image_url}`} alt="cover preview" className="h-44 w-full rounded-xl border object-cover" /> : <div className="flex h-44 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Preview cover akan tampil di sini</div>}
              <div className="space-y-1">
                <Input type="file" accept="image/*" onChange={onUploadCover} className="shadow-xs" />
                <p className="text-xs text-muted-foreground">{uploadingCover ? "Sedang upload cover..." : "Upload cover image untuk mengisi field otomatis."}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b px-5 py-3 flex items-center gap-2">
              <ScanSearch className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">SEO & Discoverability</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Meta Title</Label>
                <Input placeholder="Judul SEO artikel" value={form.meta_title} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} className="shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Meta Description</Label>
                <textarea className="w-full min-h-28 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs" placeholder="Deskripsi singkat artikel untuk mesin pencari..." value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b px-5 py-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Preview Ringkas</h3>
            </div>
            <div className="p-5">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{form.status || "draft"}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{form.title || "Judul artikel"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{form.excerpt || "Excerpt artikel akan muncul di sini."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button size="sm" variant="outline" onClick={() => navigate("/cms/blog")}>Batal</Button>
        <Button size="sm" onClick={submit} className="min-w-[120px]">Publikasikan</Button>
      </div>
    </PageShell>
  )
}
