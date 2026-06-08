import { useEffect, useState } from "react"
import axios from "axios"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ImagePlus, Newspaper, ScanSearch, Sparkles } from "lucide-react"
import PageShell from "../../../components/PageShell"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useAppDialog } from "../../../context/AppDialogContext"
import JoditEditor from "jodit-react"
import { resolveAssetUrl } from "@/lib/runtime"

const API = "http://localhost:8080/api"

export default function CMSBlogEdit() {
  const { id } = useParams()
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
      setForm((p) => ({ ...p, content: `${p.content}\n<img src="${path}" alt="${f.name}" />` }))
      await dialog.alert("Gambar berhasil diupload dan ditambahkan ke content")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Upload gambar konten gagal")
    } finally {
      setUploadingInline(false)
      e.target.value = ""
    }
  }

  useEffect(() => {
    const run = async () => {
      const res = await axios.get(`${API}/cms/posts`)
      const row = (res.data || []).find((x: any) => x.id === id)
      if (!row) return
      setForm(row)
    }
    run()
  }, [id])

  const submit = async () => {
    try {
      await axios.put(`${API}/cms/posts/${id}`, form)
      await dialog.alert("Post berhasil diperbarui")
      navigate("/cms/blog")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal update post")
    }
  }

  return (
    <PageShell
      title="Edit Blog Post"
      description="Perbarui artikel blog sekolah lengkap dengan cover dan metadata publikasi."
      backButton={<Button asChild size="icon" variant="ghost" className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9"><Link to="/cms/blog"><ArrowLeft className="h-4 w-4" /></Link></Button>}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={() => navigate("/cms/blog")}>Batal</Button>
          <Button size="sm" onClick={submit}>Update</Button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_400px]">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-slate-500" /> Naskah Artikel
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Perbarui isi artikel utama yang akan tampil di halaman blog publik.</p>
          </div>
          <div className="p-4 space-y-5">
            <div className="space-y-2">
              <Label>Judul Artikel</Label>
              <Input 
                placeholder="Contoh: Prestasi Siswa di Olimpiade Nasional" 
                value={form.title} 
                onChange={(e) => {
                  const val = e.target.value;
                  const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  setForm((p) => ({ ...p, title: val, slug }))
                }} 
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input placeholder="prestasi-siswa-olimpiade" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status Publikasi</Label>
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
              <Label>Excerpt</Label>
              <textarea className="w-full min-h-24 rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Ringkasan singkat artikel untuk daftar blog..." value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Konten Artikel</Label>
              <JoditEditor
                value={form.content}
                config={{ minHeight: 340, placeholder: "Tulis isi artikel lengkap, paragraf berita, kutipan, dan informasi pendukung..." }}
                onBlur={(newContent) => setForm((p) => ({ ...p, content: newContent }))}
              />
            </div>

            <div className="rounded-md border border-dashed border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ImagePlus className="h-4 w-4 text-slate-500" />
                Sisipkan gambar ke artikel
              </div>
              <p className="mt-1 text-xs text-slate-400">Gambar akan ditambahkan otomatis ke area konten.</p>
              <div className="mt-3 space-y-1">
                <Input type="file" accept="image/*" onChange={onUploadInline} />
                <p className="text-xs text-slate-400">{uploadingInline ? "Sedang upload gambar konten..." : "Pilih JPG, PNG, atau WebP."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-slate-500" /> Media & Cover
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Kelola thumbnail utama untuk halaman detail dan daftar blog.</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input placeholder="/uploads/cms/..." value={form.cover_image_url} onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))} />
              </div>
              {form.cover_image_url ? <img src={resolveAssetUrl(form.cover_image_url)} alt="cover preview" className="h-44 w-full rounded-md border border-slate-200 object-cover" /> : <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-400 bg-slate-50">Preview cover akan tampil di sini</div>}
              <div className="space-y-1">
                <Input type="file" accept="image/*" onChange={onUploadCover} />
                <p className="text-xs text-slate-400">{uploadingCover ? "Sedang upload cover..." : "Upload cover image untuk mengisi field otomatis."}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <ScanSearch className="h-4 w-4 text-slate-500" /> SEO & Discoverability
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Optimalkan tampilan artikel di hasil pencarian dan saat dibagikan.</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input placeholder="Judul SEO artikel" value={form.meta_title} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <textarea className="w-full min-h-28 rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Deskripsi singkat artikel untuk mesin pencari..." value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" /> Preview Ringkas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Pratinjau cepat sebelum artikel dipublikasikan.</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{form.status || "draft"}</p>
                <h3 className="mt-2 text-md font-bold text-slate-800">{form.title || "Judul artikel"}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{form.excerpt || "Excerpt artikel akan muncul di sini."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
