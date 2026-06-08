import { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, LayoutTemplate, Sparkles } from "lucide-react"
import PageShell from "../../../components/PageShell"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useAppDialog } from "../../../context/AppDialogContext"
import JoditEditor from "jodit-react"

const API = "http://localhost:8080/api"
const pageOptions = [
  {
    group: "Pengaturan Global (Semua Halaman)",
    items: [
      { value: "global-brand", label: "Logo & Nama Sekolah (Header Atas)" },
      { value: "global-footer", label: "Teks Footer (Paling Bawah Website)" },
    ]
  },
  {
    group: "Beranda - Bagian 1: Banner / Hero",
    items: [
      { value: "home-hero", label: "Teks Banner Utama" },
      { value: "home-stat-1", label: "Kotak Angka Kiri (01)" },
      { value: "home-stat-2", label: "Kotak Angka Kanan (Total Artikel)" },
    ]
  },
  {
    group: "Beranda - Bagian 2: Tentang Kami",
    items: [
      { value: "home-about", label: "Judul & Deskripsi Cerita Sekolah" },
      { value: "home-highlight-1", label: "Poin Sorotan 1 (Visi Institusi)" },
      { value: "home-highlight-2", label: "Poin Sorotan 2 (Arah Komunikasi)" },
      { value: "home-highlight-3", label: "Poin Sorotan 3 (Kontak Publik)" },
    ]
  },
  {
    group: "Beranda - Bagian 3: Nilai / Keunggulan",
    items: [
      { value: "home-values", label: "Judul Header 'Nilai Sekolah'" },
      { value: "home-value-1", label: "Kotak Nilai 1 (Kiri)" },
      { value: "home-value-2", label: "Kotak Nilai 2 (Tengah)" },
      { value: "home-value-3", label: "Kotak Nilai 3 (Kanan)" },
      { value: "home-value-4", label: "Kotak Nilai 4 (Kanan Ujung)" },
    ]
  },
  {
    group: "Beranda - Bagian 4: Publikasi",
    items: [
      { value: "home-blog", label: "Judul Header 'Publikasi Terbaru'" },
    ]
  },
  {
    group: "Halaman Lainnya",
    items: [
      { value: "blog-hero", label: "Halaman Daftar Artikel - Header Atas" },
      { value: "ppdb-hero", label: "Halaman PPDB - Header Atas" },
      { value: "ppdb-form", label: "Halaman PPDB - Teks Samping Form" },
    ]
  },
  {
    group: "Halaman Penuh (Legacy)",
    items: [
      { value: "home", label: "Beranda (Legacy)" },
      { value: "about", label: "Tentang Sekolah (Legacy)" },
      { value: "vision", label: "Visi & Misi (Legacy)" },
      { value: "contact", label: "Kontak (Legacy)" },
    ]
  }
]

export default function CMSCompanyCreate() {
  const navigate = useNavigate()
  const dialog = useAppDialog()
  const [form, setForm] = useState({ key: "", title: "", content: "", meta_title: "", meta_description: "", is_published: false })
  const [uploading, setUploading] = useState(false)

  const uploadImage = async (file: File) => {
    const fd = new FormData()
    fd.append("image", file)
    const res = await axios.post(`${API}/upload/cms-image`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data?.image_url as string
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    try {
      const path = await uploadImage(f)
      const imgHtml = `<img src="${path}" alt="Uploaded image" style="max-width: 100%; border-radius: 0;" />`
      if (form.key === "global-brand") {
        setForm((p) => ({ ...p, content: imgHtml }))
      } else {
        setForm((p) => ({ ...p, content: p.content + imgHtml }))
      }
      await dialog.alert("Gambar berhasil diupload dan ditambahkan ke content")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Upload gambar gagal")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const getFieldConfig = (key: string) => {
    const cfg = {
      titleLabel: "Judul / Teks Utama Singkat",
      titlePlaceholder: "Contoh: Tentang Sekolah Kami (Atau isi angka '01' untuk Hero Box)",
      contentLabel: "Isi Teks / Deskripsi Panjang",
      contentDesc: "Jika Anda memilih 'Section' (seperti Hero Box), teks ini akan mengisi deskripsi paragraf di komponen tersebut.",
      showContentField: true,
      useRichEditor: true,
      imageUploadLabel: "Upload gambar konten",
      imageUploadDesc: "Gambar akan disisipkan otomatis ke area konten dalam format HTML.",
      seoCardTitle: "Publikasi & SEO",
      seoCardDesc: "Atur status tayang dan metadata untuk mesin pencari.",
      showMetaTitle: true,
      metaTitleLabel: "Meta Title",
      metaTitlePlaceholder: "Judul SEO halaman",
      showMetaDesc: true,
      metaDescLabel: "Meta Description",
    };

    if (!key) return cfg;

    if (key === "global-brand") {
      cfg.titleLabel = "Nama Sekolah Utama";
      cfg.titlePlaceholder = "Contoh: BIMA SCHOOL";
      cfg.showContentField = false;
      cfg.imageUploadLabel = "Upload Logo Sekolah";
      cfg.imageUploadDesc = "Pilih file gambar (PNG/JPG) untuk logo sekolah Anda. Secara otomatis akan menggantikan inisial.";
      cfg.seoCardTitle = "Pengaturan Tambahan Logo";
      cfg.seoCardDesc = "Teks pendukung untuk logo sekolah.";
      cfg.metaTitleLabel = "Teks Kecil (Eyebrow) di Atas Nama";
      cfg.metaTitlePlaceholder = "Contoh: Institusi Resmi";
      cfg.showMetaDesc = false;
    } else if (key === "global-footer") {
      cfg.titleLabel = "Judul Footer";
      cfg.titlePlaceholder = "Contoh: Portal Sekolah";
      cfg.contentLabel = "Teks Penjelasan Footer";
      cfg.contentDesc = "Deskripsi yang muncul di bagian paling bawah website.";
      cfg.showMetaTitle = false;
      cfg.showMetaDesc = false;
    } else if (key.includes("stat") || key.includes("value-") || key.includes("highlight") || key === "ppdb-form") {
      cfg.titleLabel = "Judul Kotak / Teks Sorotan";
      cfg.titlePlaceholder = "Contoh: 01, Visi Institusi, atau Akademik yang terarah";
      cfg.contentLabel = "Deskripsi Kotak";
      cfg.contentDesc = "Teks penjelasan untuk kotak tersebut (Dapat menggunakan format text atau gambar).";
      cfg.showMetaTitle = false;
      cfg.showMetaDesc = false;
    } else if (key.includes("-hero") || key.includes("-about") || key.includes("-blog") || key.includes("-values") || key.includes("ppdb-hero")) {
      cfg.titleLabel = "Judul Bagian (Section)";
      cfg.titlePlaceholder = "Contoh: Sekolah yang membangun karakter...";
      cfg.contentLabel = "Deskripsi Bagian (Section)";
      cfg.seoCardTitle = "Pengaturan Pendukung Section";
      cfg.seoCardDesc = "Atur teks pendukung untuk area section ini.";
      cfg.metaTitleLabel = "Teks Kecil (Eyebrow) di Atas Judul";
      cfg.metaTitlePlaceholder = "Contoh: Profil Institusi";
      cfg.metaDescLabel = "Cadangan Teks Pendek (Opsional)";
    }

    return cfg;
  };

  const config = getFieldConfig(form.key);

  const submit = async () => {
    try {
      await axios.post(`${API}/cms/pages`, form)
      await dialog.alert("Halaman profile berhasil dibuat")
      navigate("/cms/company")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal membuat halaman")
    }
  }

  return (
    <PageShell
      title="Create Company Profile"
      description="Bangun halaman portal publik dengan struktur konten dan pengaturan SEO yang rapi."
      backButton={<Button asChild size="icon" variant="ghost" className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9"><Link to="/cms/company"><ArrowLeft className="h-4 w-4" /></Link></Button>}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={() => navigate("/cms/company")}>Batal</Button>
          <Button size="sm" onClick={submit}>Create</Button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-slate-500" /> Konten Halaman
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Susun isi halaman company profile utama yang akan tampil di portal publik.</p>
          </div>
          <div className="p-4 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Section Halaman</Label>
                <Select value={form.key} onValueChange={(v) => setForm((p) => ({ ...p, key: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih section halaman" /></SelectTrigger>
                  <SelectContent>
                    {pageOptions.map((group, idx) => (
                      <SelectGroup key={idx}>
                        <SelectLabel className="bg-slate-100 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-y mt-1">{group.group}</SelectLabel>
                        {group.items.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="pl-6">{option.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{config.titleLabel}</Label>
                <Input placeholder={config.titlePlaceholder} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
            </div>

            {config.showContentField && (
              <div className="space-y-2">
                <Label>{config.contentLabel}</Label>
                <p className="text-xs text-slate-400 mb-2">{config.contentDesc}</p>
                {config.useRichEditor ? (
                  <JoditEditor
                    value={form.content}
                    config={{ minHeight: 320, placeholder: "Tulis narasi company profile, hero section, keunggulan sekolah, dan konten pendukung lainnya..." }}
                    onBlur={(newContent) => setForm((p) => ({ ...p, content: newContent }))}
                  />
                ) : (
                  <Input placeholder="Isi teks di sini..." value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
                )}
              </div>
            )}

            <div className="rounded-md border border-dashed border-slate-200 p-4 bg-slate-50/50">
              <Label className="mb-2 block text-xs font-semibold text-slate-700">{config.imageUploadLabel}</Label>
              <p className="text-xs text-slate-400 mb-4">{config.imageUploadDesc}</p>
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {form.key === "global-brand" && form.content.includes("<img") && (
                <div className="mt-4 p-2 border border-slate-200 rounded-md bg-white w-max shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Preview Logo</p>
                  <div dangerouslySetInnerHTML={{ __html: form.content }} className="w-16 h-16 [&>img]:w-full [&>img]:h-full [&>img]:object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" /> {config.seoCardTitle}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">{config.seoCardDesc}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Status Publish</Label>
                <Select value={form.is_published ? "true" : "false"} onValueChange={(v) => setForm((p) => ({ ...p, is_published: v === "true" }))}>
                  <SelectTrigger><SelectValue placeholder="Status publish" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.showMetaTitle && (
                <div className="space-y-2">
                  <Label>{config.metaTitleLabel}</Label>
                  <Input placeholder={config.metaTitlePlaceholder} value={form.meta_title} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} />
                </div>
              )}

              {config.showMetaDesc && (
                <div className="space-y-2">
                  <Label>{config.metaDescLabel}</Label>
                  <textarea className="w-full min-h-28 rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Ringkasan singkat untuk deskripsi mesin pencari..." value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">Preview Ringkas</h4>
              <p className="text-xs text-slate-400 mt-0.5">Gambaran cepat bagaimana struktur konten akan tampil.</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{form.key || "Section belum dipilih"}</p>
                <h3 className="mt-2 text-md font-bold text-slate-800">{form.title || "Judul halaman"}</h3>
                <div className="mt-3 max-h-48 overflow-auto text-xs text-slate-500 leading-relaxed">
                  {form.content ? (
                    <div dangerouslySetInnerHTML={{ __html: form.content }} />
                  ) : (
                    <p>Konten halaman akan muncul di sini.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
