import { useEffect, useState } from "react"
import axios from "axios"
import PageShell from "../../../components/PageShell"
import { Button } from "../../../components/ui/button"
import { useAppDialog } from "../../../context/AppDialogContext"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Loader2 } from "lucide-react"
import { resolveAssetUrl } from "@/lib/runtime"

const API = "http://localhost:8080/api"

export default function CMSSiteConfig() {
  const dialog = useAppDialog()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    school_name: "", school_tagline: "", logo_url: "",
    hero_title: "", hero_description: "", hero_image_url: "", hero_cta_1_text: "", hero_cta_1_url: "", hero_cta_2_text: "", hero_cta_2_url: "",
    stat_1_label: "", stat_1_value: "",
    stat_2_label: "", stat_2_value: "",
    stat_3_label: "", stat_3_value: "",
    stat_4_label: "", stat_4_value: "",
    stat_5_label: "", stat_5_value: "",
    about_title: "", about_content: "", about_image_url: "",
    program_1_title: "", program_1_desc: "", program_2_title: "", program_2_desc: "",
    program_3_title: "", program_3_desc: "", program_4_title: "", program_4_desc: "",
    footer_description: "", footer_address: "", footer_phone: "", footer_email: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/site-config`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      if (res.data) setForm(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await axios.put(`${API}/site-config`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      dialog.alert("Berhasil", "Konfigurasi website berhasil disimpan.")
    } catch (e: any) {
      dialog.alert("Gagal", e.response?.data?.message || "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    try {
      setSaving(true);
      const res = await axios.post(`${API}/upload/cms-image`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setForm(prev => ({ ...prev, [fieldName]: res.data.image_url }));
      dialog.alert("Berhasil", "Gambar berhasil diupload!");
    } catch (err: any) {
      dialog.alert("Gagal", err.response?.data?.message || "Gagal mengupload gambar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageShell title="Pengaturan Website"><Loader2 className="animate-spin" /></PageShell>

  return (
    <PageShell
      title="Pengaturan Website"
      description="Konfigurasi halaman depan portal publik"
      footer={
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Simpan Konfigurasi
        </Button>
      }
    >
      <div className="flex flex-col gap-6 max-w-full pb-10">

        {/* Branding */}
        <section className="bg-white p-6 border shadow-sm rounded-lg space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Branding & Identitas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nama Sekolah</Label><Input name="school_name" value={form.school_name} onChange={handleChange} /></div>
            <div><Label>Tagline</Label><Input name="school_tagline" value={form.school_tagline} onChange={handleChange} /></div>
            <div className="col-span-2">
              <Label>Logo (Upload atau Paste URL)</Label>
              <div className="flex gap-2">
                <Input name="logo_url" value={form.logo_url} onChange={handleChange} placeholder="https://..." className="flex-1" />
                <Input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, "logo_url")} className="w-[300px]" />
              </div>
              {form.logo_url && <img src={resolveAssetUrl(form.logo_url)} alt="Logo" className="mt-2 h-16 object-contain" />}
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="bg-white p-6 border shadow-sm rounded-lg space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Hero Section (Beranda)</h2>
          <div><Label>Judul Hero</Label><Input name="hero_title" value={form.hero_title} onChange={handleChange} /></div>
          <div><Label>Deskripsi Hero</Label><Textarea name="hero_description" value={form.hero_description} onChange={handleChange} rows={3} /></div>
          <div>
            <Label>Gambar Hero (Upload atau Paste URL)</Label>
            <div className="flex gap-2">
              <Input name="hero_image_url" value={form.hero_image_url} onChange={handleChange} placeholder="https://..." className="flex-1" />
              <Input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, "hero_image_url")} className="w-[300px]" />
            </div>
            {form.hero_image_url && <img src={resolveAssetUrl(form.hero_image_url)} alt="Hero" className="mt-2 h-32 object-cover rounded-md" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Teks Tombol CTA 1</Label><Input name="hero_cta_1_text" value={form.hero_cta_1_text} onChange={handleChange} /></div>
            <div><Label>URL Tombol CTA 1</Label><Input name="hero_cta_1_url" value={form.hero_cta_1_url} onChange={handleChange} /></div>
            <div><Label>Teks Tombol CTA 2</Label><Input name="hero_cta_2_text" value={form.hero_cta_2_text} onChange={handleChange} /></div>
            <div><Label>URL Tombol CTA 2</Label><Input name="hero_cta_2_url" value={form.hero_cta_2_url} onChange={handleChange} /></div>
          </div>
        </section>

        {/* Dynamic Stats Labels */}
        <section className="bg-white p-6 border shadow-sm rounded-lg space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Statistik (Custom Max 5)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Label Stat 1</Label><Input name="stat_1_label" value={form.stat_1_label} onChange={handleChange} placeholder="Siswa" /></div>
            <div><Label>Value Stat 1</Label><Input name="stat_1_value" value={form.stat_1_value} onChange={handleChange} placeholder="500+" /></div>

            <div><Label>Label Stat 2</Label><Input name="stat_2_label" value={form.stat_2_label} onChange={handleChange} placeholder="Guru" /></div>
            <div><Label>Value Stat 2</Label><Input name="stat_2_value" value={form.stat_2_value} onChange={handleChange} placeholder="50+" /></div>

            <div><Label>Label Stat 3</Label><Input name="stat_3_label" value={form.stat_3_label} onChange={handleChange} placeholder="Pendaftar PPDB" /></div>
            <div><Label>Value Stat 3</Label><Input name="stat_3_value" value={form.stat_3_value} onChange={handleChange} placeholder="120+" /></div>

            <div><Label>Label Stat 4</Label><Input name="stat_4_label" value={form.stat_4_label} onChange={handleChange} placeholder="Penghargaan" /></div>
            <div><Label>Value Stat 4</Label><Input name="stat_4_value" value={form.stat_4_value} onChange={handleChange} placeholder="35" /></div>

            <div><Label>Label Stat 5</Label><Input name="stat_5_label" value={form.stat_5_label} onChange={handleChange} placeholder="Lulusan Terbaik" /></div>
            <div><Label>Value Stat 5</Label><Input name="stat_5_value" value={form.stat_5_value} onChange={handleChange} placeholder="1.2k" /></div>
          </div>
        </section>

        {/* About */}
        <section className="bg-white p-6 border shadow-sm rounded-lg space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Tentang Kami</h2>
          <div><Label>Judul</Label><Input name="about_title" value={form.about_title} onChange={handleChange} /></div>
          <div>
            <Label>Gambar / Foto Utama</Label>
            <div className="flex gap-2">
              <Input name="about_image_url" value={form.about_image_url} onChange={handleChange} placeholder="https://..." className="flex-1" />
              <Input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, "about_image_url")} className="w-[300px]" />
            </div>
            {form.about_image_url && (
              <div className="mt-2 w-48 aspect-video relative rounded-md overflow-hidden border">
                <img src={resolveAssetUrl(form.about_image_url)} alt="About Image Preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>
          <div><Label>Konten (HTML didukung)</Label><Textarea name="about_content" value={form.about_content} onChange={handleChange} rows={5} /></div>
        </section>

        {/* Programs / Cards */}
        <section className="bg-white p-6 border shadow-sm rounded-lg space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Kartu Program (4 Item)</h2>
          {[1, 2, 3, 4].map(num => (
            <div key={num} className="grid grid-cols-3 gap-4 pb-4 border-b last:border-0">
              <div className="col-span-1"><Label>Judul Program {num}</Label><Input name={`program_${num}_title`} value={(form as any)[`program_${num}_title`]} onChange={handleChange} /></div>
              <div className="col-span-2"><Label>Deskripsi {num}</Label><Textarea name={`program_${num}_desc`} value={(form as any)[`program_${num}_desc`]} onChange={handleChange} rows={2} /></div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <section className="bg-white p-6 border shadow-sm rounded-lg space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Footer / Kontak</h2>
          <div><Label>Deskripsi Singkat</Label><Textarea name="footer_description" value={form.footer_description} onChange={handleChange} rows={2} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Alamat</Label><Input name="footer_address" value={form.footer_address} onChange={handleChange} /></div>
            <div><Label>Telepon</Label><Input name="footer_phone" value={form.footer_phone} onChange={handleChange} /></div>
            <div><Label>Email</Label><Input name="footer_email" value={form.footer_email} onChange={handleChange} /></div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
