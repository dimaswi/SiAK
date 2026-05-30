import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import axios from "axios"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

export default function PPDBCreate() {
  const navigate = useNavigate()
  const dialog = useAppDialog()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "", nisn: "", birth_date: "", gender: "L", religion: "",
    place_of_birth: "", address: "", previous_school: "", parent_phone: "",
    father_name: "", father_occupation: "", father_phone: "",
    mother_name: "", mother_occupation: "", mother_phone: "",
    parent_income: "", document_kk: "", document_akta: ""
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append("document", file);

    setIsUploading(true);
    try {
      const res = await axios.post(`${API}/public/ppdb/upload`, uploadData)
      setFormData(prev => ({ ...prev, [fieldName]: res.data.document_url }));
      await dialog.alert("Dokumen berhasil diupload.");
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal mengupload dokumen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name || !formData.birth_date || !formData.parent_phone) {
      return dialog.alert("Mohon lengkapi Nama, Tanggal Lahir, dan No HP Utama")
    }

    try {
      await axios.post(`${API}/ppdb/applications`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      await dialog.alert("Pendaftar berhasil ditambahkan")
      navigate("/ppdb")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal menambahkan data")
    }
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1">
      {/* Page Header */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-1">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/ppdb"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Pendaftar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Masukkan data calon siswa baru secara manual.</p>
          </div>
        </div>
      </div>

      <form id="ppdb-create-form" onSubmit={handleCreate} className="flex-1 px-4 md:px-6 lg:px-8 space-y-8 pb-28">
        {/* Section: Data Pribadi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Data Pribadi Siswa</h2>
            <p className="text-sm text-slate-500 mt-1">Informasi dasar identitas calon siswa baru.</p>
          </div>
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-700">Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required className="bg-transparent shadow-xs" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-700">NISN</Label>
                <Input value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Jenis Kelamin</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Tempat Lahir</Label>
                <Input value={formData.place_of_birth} onChange={e => setFormData({ ...formData, place_of_birth: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Tanggal Lahir <span className="text-red-500">*</span></Label>
                <Input type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} required className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Agama</Label>
                <Input value={formData.religion} onChange={e => setFormData({ ...formData, religion: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Asal Sekolah</Label>
                <Input value={formData.previous_school} onChange={e => setFormData({ ...formData, previous_school: e.target.value })} placeholder="Cth: SMPN 1 Jakarta" className="bg-transparent shadow-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Alamat Lengkap</Label>
              <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="bg-transparent shadow-xs" />
            </div>
          </div>
        </div>

        {/* Section: Data Orang Tua */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Data Orang Tua / Wali</h2>
            <p className="text-sm text-slate-500 mt-1">Informasi kontak dan data orang tua atau wali siswa.</p>
          </div>
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-700">No. HP Aktif (Utama) <span className="text-red-500">*</span></Label>
              <Input value={formData.parent_phone} onChange={e => setFormData({ ...formData, parent_phone: e.target.value })} required className="bg-transparent shadow-xs" />
              <p className="text-[13px] text-slate-500">Digunakan untuk informasi kelulusan.</p>
            </div>
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-700">Nama Ayah</Label>
                <Input value={formData.father_name} onChange={e => setFormData({ ...formData, father_name: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Pekerjaan Ayah</Label>
                <Input value={formData.father_occupation} onChange={e => setFormData({ ...formData, father_occupation: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">No. HP Ayah</Label>
                <Input value={formData.father_phone} onChange={e => setFormData({ ...formData, father_phone: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-700">Nama Ibu</Label>
                <Input value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Pekerjaan Ibu</Label>
                <Input value={formData.mother_occupation} onChange={e => setFormData({ ...formData, mother_occupation: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">No. HP Ibu</Label>
                <Input value={formData.mother_phone} onChange={e => setFormData({ ...formData, mother_phone: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Label className="text-slate-700">Penghasilan Orang Tua</Label>
              <Input value={formData.parent_income} onChange={e => setFormData({ ...formData, parent_income: e.target.value })} placeholder="Cth: Rp 2.000.000 - Rp 5.000.000" className="bg-transparent shadow-xs" />
            </div>
          </div>
        </div>

        {/* Section: Dokumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Dokumen Digital</h2>
            <p className="text-sm text-slate-500 mt-1">Upload berkas persyaratan pendaftaran dalam format PDF atau gambar.</p>
          </div>
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-dashed border-slate-300 rounded-lg p-5 space-y-3">
                <Label className="text-slate-700 block">Kartu Keluarga (KK)</Label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "document_kk")} disabled={isUploading} className="text-sm w-full" />
                {formData.document_kk && <p className="text-sm text-emerald-600 font-medium">✓ File terupload</p>}
              </div>
              <div className="border border-dashed border-slate-300 rounded-lg p-5 space-y-3">
                <Label className="text-slate-700 block">Akte Kelahiran</Label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "document_akta")} disabled={isUploading} className="text-sm w-full" />
                {formData.document_akta && <p className="text-sm text-emerald-600 font-medium">✓ File terupload</p>}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild><Link to="/ppdb">Batal</Link></Button>
        <Button type="submit" form="ppdb-create-form" disabled={isUploading} className="min-w-[140px]">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Pendaftar
        </Button>
      </div>
    </div>
  )
}
