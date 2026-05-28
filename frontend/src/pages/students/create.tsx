import { useState, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Loader2, Save, Camera, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"

const API = "http://localhost:8080/api"

const religions = ["Islam", "Kristen Protestan", "Katolik", "Hindu", "Budha", "Konghucu"]
const transportOptions = ["Jalan kaki", "Sepeda", "Sepeda motor", "Mobil pribadi", "Angkutan umum", "Antar jemput sekolah", "Lainnya"]
const livingWithOptions = ["Orang tua kandung", "Wali", "Kos/kontrak", "Asrama", "Pesantren", "Lainnya"]
const educationLevels = [
  { value: "sd", label: "SD/MI" }, { value: "smp", label: "SMP/MTs" },
  { value: "sma", label: "SMA/SMK/MA" }, { value: "d3", label: "D3" },
  { value: "d4", label: "D4" }, { value: "s1", label: "S1" },
  { value: "s2", label: "S2" }, { value: "s3", label: "S3" },
  { value: "tidak_sekolah", label: "Tidak Bersekolah" },
]

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</CardContent>
    </Card>
  )
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      {children}
    </div>
  )
}

const initialForm = {
  nis: "", nisn: "", password: "", full_name: "", gender: "L",
  birth_place: "", birth_date: "", religion: "", nationality: "WNI",
  birth_certificate_no: "", kk_number: "",
  pip_number: "", pip_reason: "",
  child_order: 0, num_siblings: 0, living_with: "", transportation: "", special_needs: "",
  address: "", rt_rw: "", village: "", district: "", city: "", province: "", postal_code: "",
  phone: "", enrollment_date: "",
  father_name: "", father_nik: "", father_birth_year: 0,
  father_education: "", father_occupation: "", father_income: 0, father_is_alive: true,
  mother_name: "", mother_nik: "", mother_birth_year: 0,
  mother_education: "", mother_occupation: "", mother_income: 0, mother_is_alive: true,
  parent_name: "", parent_phone: "",
  guardian_name: "", guardian_nik: "", guardian_phone: "", guardian_occupation: "", guardian_relation: "",
}

export default function StudentCreate() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<Record<string, any>>(initialForm)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === "checkbox") setFormData(prev => ({ ...prev, [name]: checked }))
    else if (type === "number") setFormData(prev => ({ ...prev, [name]: Number(value) }))
    else setFormData(prev => ({ ...prev, [name]: value }))
  }
  const handleSelect = (name: string, value: string) => setFormData(prev => ({ ...prev, [name]: value }))
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsSubmitting(true)
    try {
      await axios.post(`${API}/students`, formData)
      if (photoFile) {
        try {
          const listRes = await axios.get(`${API}/students?search=${formData.nis}&limit=1`)
          const student = listRes.data?.data?.[0]
          if (student?.id) {
            const fd = new FormData(); fd.append("photo", photoFile)
            await axios.post(`${API}/upload/photo?entity_type=student&entity_id=${student.id}`, fd)
          }
        } catch (_) { }
      }
      navigate("/siswa")
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.")
    } finally { setIsSubmitting(false) }
  }

  return (
    <PageShell title="Tambah Siswa Baru" description="Lengkapi data berikut sesuai standar Dapodik Kemdikbud."
      backButton={<Button variant="outline" size="icon" className="rounded-none shrink-0" asChild><Link to="/siswa"><ArrowLeft className="h-4 w-4" /></Link></Button>}
      footer={
        <>
          <Button type="button" variant="outline" asChild><Link to="/siswa">Batal</Link></Button>
          <Button type="submit" form="student-form" disabled={isSubmitting} className="gap-2 min-w-[140px]">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Data
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <form id="student-form" onSubmit={handleSubmit} className="flex flex-col flex-1 h-full relative">
          <Tabs defaultValue="profil" className="w-full flex-1 flex flex-col gap-6">
            <div className="border-b px-2">
              <TabsList className="bg-transparent h-12 p-0 w-full justify-start overflow-x-auto rounded-none border-b-0 gap-6">
                <TabsTrigger value="profil" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Profil & Identitas</TabsTrigger>
                <TabsTrigger value="sosial" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Sosial & Alamat</TabsTrigger>
                <TabsTrigger value="keluarga" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Data Orang Tua & Wali</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 pb-24">
              <TabsContent value="profil" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <Card className="border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium">Foto Profil</CardTitle>
                    <CardDescription>Format JPG, PNG, atau WebP. Maks 5MB.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-6">
                    <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {photoPreview ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-muted-foreground" />}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera className="h-5 w-5 text-white" /></div>
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Pilih Foto</Button>
                      <p className="text-xs text-muted-foreground mt-2">Klik foto atau tombol untuk memilih file</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhotoChange} />
                  </CardContent>
                </Card>

                <FormSection title="Akun Login" description="Siswa akan login menggunakan NIS dan password ini.">
                  <Field label="NIS" required><Input name="nis" placeholder="Nomor Induk Siswa" required value={formData.nis} onChange={handleChange} /></Field>
                  <Field label="NISN"><Input name="nisn" placeholder="Nomor Induk Siswa Nasional (10 digit)" value={formData.nisn} onChange={handleChange} /></Field>
                  <Field label="Password" required><Input name="password" type="password" placeholder="Buat password login siswa" required value={formData.password} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Identitas Pribadi">
                  <Field label="Nama Lengkap" required><Input name="full_name" placeholder="Sesuai Akta Kelahiran" required value={formData.full_name} onChange={handleChange} /></Field>
                  <Field label="Jenis Kelamin" required>
                    <Select value={formData.gender} onValueChange={v => handleSelect("gender", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Agama">
                    <Select value={formData.religion} onValueChange={v => handleSelect("religion", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih agama" /></SelectTrigger>
                      <SelectContent>{religions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tempat Lahir"><Input name="birth_place" placeholder="Kota kelahiran" value={formData.birth_place} onChange={handleChange} /></Field>
                  <Field label="Tanggal Lahir"><Input name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} /></Field>
                  <Field label="Kewarganegaraan"><Input name="nationality" value={formData.nationality} onChange={handleChange} /></Field>
                  <Field label="No. Telepon Siswa"><Input name="phone" placeholder="08xx-xxxx-xxxx" value={formData.phone} onChange={handleChange} /></Field>
                  <Field label="Tanggal Masuk Sekolah"><Input name="enrollment_date" type="date" value={formData.enrollment_date} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Dokumen Identitas">
                  <Field label="No. Akta Kelahiran"><Input name="birth_certificate_no" placeholder="No. Akta Lahir" value={formData.birth_certificate_no} onChange={handleChange} /></Field>
                  <Field label="No. Kartu Keluarga (KK)"><Input name="kk_number" placeholder="No. KK (16 digit)" value={formData.kk_number} onChange={handleChange} /></Field>
                  <Field label="No. PIP / Kartu Indonesia Pintar"><Input name="pip_number" placeholder="No. PIP/KIP" value={formData.pip_number} onChange={handleChange} /></Field>
                  <Field label="Alasan Penerima PIP"><Input name="pip_reason" placeholder="Cth: Yatim piatu, keluarga tidak mampu" value={formData.pip_reason} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="sosial" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Data Sosial">
                  <Field label="Anak ke-"><Input name="child_order" type="number" min="1" placeholder="Cth: 2" value={formData.child_order || ""} onChange={handleChange} /></Field>
                  <Field label="Jumlah Saudara Kandung"><Input name="num_siblings" type="number" min="0" placeholder="Cth: 3" value={formData.num_siblings || ""} onChange={handleChange} /></Field>
                  <Field label="Tinggal Bersama">
                    <Select value={formData.living_with} onValueChange={v => handleSelect("living_with", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>{livingWithOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Transportasi ke Sekolah">
                    <Select value={formData.transportation} onValueChange={v => handleSelect("transportation", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>{transportOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Kebutuhan Khusus"><Input name="special_needs" placeholder="Cth: Tunanetra, Tunarungu, atau kosongkan jika tidak ada" value={formData.special_needs} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Alamat Tempat Tinggal">
                  <Field label="Alamat Jalan"><Input name="address" placeholder="Nama jalan, No. rumah" value={formData.address} onChange={handleChange} /></Field>
                  <Field label="RT/RW"><Input name="rt_rw" placeholder="Cth: 003/012" value={formData.rt_rw} onChange={handleChange} /></Field>
                  <Field label="Kelurahan / Desa"><Input name="village" value={formData.village} onChange={handleChange} /></Field>
                  <Field label="Kecamatan"><Input name="district" value={formData.district} onChange={handleChange} /></Field>
                  <Field label="Kota / Kabupaten"><Input name="city" value={formData.city} onChange={handleChange} /></Field>
                  <Field label="Provinsi"><Input name="province" value={formData.province} onChange={handleChange} /></Field>
                  <Field label="Kode Pos"><Input name="postal_code" placeholder="12345" value={formData.postal_code} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="keluarga" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <Card className="border bg-card">
                  <CardHeader className="pb-4"><CardTitle className="text-base font-medium">Data Ayah Kandung</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nama Ayah"><Input name="father_name" placeholder="Nama lengkap ayah" value={formData.father_name} onChange={handleChange} /></Field>
                    <Field label="NIK Ayah"><Input name="father_nik" placeholder="16 digit NIK" value={formData.father_nik} onChange={handleChange} /></Field>
                    <Field label="Tahun Lahir Ayah"><Input name="father_birth_year" type="number" placeholder="Cth: 1975" value={formData.father_birth_year || ""} onChange={handleChange} /></Field>
                    <Field label="Pendidikan Terakhir Ayah">
                      <Select value={formData.father_education} onValueChange={v => handleSelect("father_education", v)}>
                        <SelectTrigger><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
                        <SelectContent>{educationLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Pekerjaan Ayah"><Input name="father_occupation" placeholder="Cth: PNS, Wiraswasta, Petani" value={formData.father_occupation} onChange={handleChange} /></Field>
                    <Field label="Penghasilan Bulanan Ayah (Rp)"><Input name="father_income" type="number" min="0" placeholder="0" value={formData.father_income || ""} onChange={handleChange} /></Field>
                    <div className="space-y-1.5 flex items-center gap-2 pt-5">
                      <input type="checkbox" id="father_is_alive" name="father_is_alive" checked={formData.father_is_alive} onChange={handleChange} className="h-4 w-4 rounded" />
                      <Label htmlFor="father_is_alive" className="text-sm cursor-pointer">Ayah masih hidup</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card">
                  <CardHeader className="pb-4"><CardTitle className="text-base font-medium">Data Ibu Kandung</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nama Ibu"><Input name="mother_name" placeholder="Nama lengkap ibu" value={formData.mother_name} onChange={handleChange} /></Field>
                    <Field label="NIK Ibu"><Input name="mother_nik" placeholder="16 digit NIK" value={formData.mother_nik} onChange={handleChange} /></Field>
                    <Field label="Tahun Lahir Ibu"><Input name="mother_birth_year" type="number" placeholder="Cth: 1978" value={formData.mother_birth_year || ""} onChange={handleChange} /></Field>
                    <Field label="Pendidikan Terakhir Ibu">
                      <Select value={formData.mother_education} onValueChange={v => handleSelect("mother_education", v)}>
                        <SelectTrigger><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
                        <SelectContent>{educationLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Pekerjaan Ibu"><Input name="mother_occupation" placeholder="Cth: Ibu Rumah Tangga, Guru" value={formData.mother_occupation} onChange={handleChange} /></Field>
                    <Field label="Penghasilan Bulanan Ibu (Rp)"><Input name="mother_income" type="number" min="0" placeholder="0" value={formData.mother_income || ""} onChange={handleChange} /></Field>
                    <div className="space-y-1.5 flex items-center gap-2 pt-5">
                      <input type="checkbox" id="mother_is_alive" name="mother_is_alive" checked={formData.mother_is_alive} onChange={handleChange} className="h-4 w-4 rounded" />
                      <Label htmlFor="mother_is_alive" className="text-sm cursor-pointer">Ibu masih hidup</Label>
                    </div>
                  </CardContent>
                </Card>

                <FormSection title="Kontak Utama Orang Tua" description="Nomor yang akan dihubungi oleh pihak sekolah.">
                  <Field label="Nama yang dapat dihubungi"><Input name="parent_name" placeholder="Nama Ayah / Ibu" value={formData.parent_name} onChange={handleChange} /></Field>
                  <Field label="No. Telepon Orang Tua"><Input name="parent_phone" placeholder="08xx-xxxx-xxxx" value={formData.parent_phone} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Data Wali (Opsional)" description="Isi jika wali bukan orang tua kandung.">
                  <Field label="Nama Wali"><Input name="guardian_name" placeholder="Nama lengkap wali" value={formData.guardian_name} onChange={handleChange} /></Field>
                  <Field label="NIK Wali"><Input name="guardian_nik" placeholder="16 digit NIK" value={formData.guardian_nik} onChange={handleChange} /></Field>
                  <Field label="No. Telepon Wali"><Input name="guardian_phone" placeholder="08xx-xxxx-xxxx" value={formData.guardian_phone} onChange={handleChange} /></Field>
                  <Field label="Pekerjaan Wali"><Input name="guardian_occupation" value={formData.guardian_occupation} onChange={handleChange} /></Field>
                  <Field label="Hubungan dengan Siswa"><Input name="guardian_relation" placeholder="Cth: Paman, Kakek, Kakak Kandung" value={formData.guardian_relation} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </div>
    </PageShell>
  )
}
