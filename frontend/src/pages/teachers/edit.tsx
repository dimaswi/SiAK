import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
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
const maritalStatuses = [
  { value: "belum_kawin", label: "Belum Kawin" },
  { value: "kawin", label: "Kawin" },
  { value: "cerai_hidup", label: "Cerai Hidup" },
  { value: "cerai_mati", label: "Cerai Mati" },
]
const employeeStatuses = [
  { value: "pns", label: "PNS (Pegawai Negeri Sipil)" },
  { value: "pppk", label: "PPPK (Pegawai Pemerintah)" },
  { value: "gtt", label: "GTT (Guru Tidak Tetap)" },
  { value: "honorer", label: "Honorer" },
  { value: "kontrak", label: "Kontrak" },
]
const educationLevels = [
  { value: "sma", label: "SMA/SMK/MA" },
  { value: "d1", label: "D1" }, { value: "d2", label: "D2" },
  { value: "d3", label: "D3" }, { value: "d4", label: "D4" },
  { value: "s1", label: "S1" }, { value: "s2", label: "S2" }, { value: "s3", label: "S3" },
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

export default function TeacherEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Record<string, any>>({
    nip: "", nuptk: "", full_name: "", gender: "L",
    birth_place: "", birth_date: "", religion: "", nationality: "WNI", marital_status: "",
    nik: "", npwp: "", employee_status: "", position: "", subject: "",
    teaching_hours: 0, rank: "", sk_number: "", join_date: "",
    education_level: "", education_major: "", university: "", graduation_year: 0, cert_number: "",
    phone: "", email: "", address: "", rt_rw: "", village: "", district: "",
    city: "", province: "", postal_code: "",
  })

  useEffect(() => {
    axios.get(`${API}/teachers/${id}`).then(res => {
      const data = res.data
      if (data.birth_date) data.birth_date = data.birth_date.split("T")[0]
      if (data.join_date) data.join_date = data.join_date.split("T")[0]
      if (data.photo_url) setPhotoPreview(`http://localhost:8080${data.photo_url}`)
      setFormData(prev => ({ ...prev, ...data }))
    }).catch(() => {
      setError("Guru tidak ditemukan.")
      navigate("/guru")
    }).finally(() => setIsLoading(false))
  }, [id, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }))
  }
  const handleSelect = (name: string, value: string) => setFormData(prev => ({ ...prev, [name]: value }))
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true); setError("")
    try {
      await axios.put(`${API}/teachers/${id}`, formData)
      if (photoFile) {
        const fd = new FormData()
        fd.append("photo", photoFile)
        await axios.post(`${API}/upload/photo?entity_type=teacher&entity_id=${id}`, fd)
      }
      navigate(`/guru/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.")
    } finally { setIsSubmitting(false) }
  }

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <PageShell title="Ubah Data Guru" description="Perbarui informasi profil guru sesuai standar Dapodik."
      backButton={<Button variant="outline" size="icon" className="rounded-none shrink-0" asChild><Link to="/guru"><ArrowLeft className="h-4 w-4" /></Link></Button>}
      footer={
        <>
          <Button type="button" variant="outline" asChild>
            <Link to={`/guru/${id}`}>Batal</Link>
          </Button>
          <Button type="submit" form="teacher-form" disabled={isSubmitting} className="gap-2 min-w-[140px]">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <form id="teacher-form" onSubmit={handleSubmit} className="flex flex-col flex-1 h-full relative">
          <Tabs defaultValue="profil" className="w-full flex-1 flex flex-col gap-6">
            <div className="border-b px-2">
              <TabsList className="bg-transparent h-12 p-0 w-full justify-start overflow-x-auto rounded-none border-b-0 gap-6">
                <TabsTrigger value="profil" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Profil Utama</TabsTrigger>
                <TabsTrigger value="kepegawaian" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Kepegawaian</TabsTrigger>
                <TabsTrigger value="pendidikan" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Pendidikan</TabsTrigger>
                <TabsTrigger value="alamat" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Alamat & Kontak</TabsTrigger>
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
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Ganti Foto</Button>
                      <p className="text-xs text-muted-foreground mt-2">Klik foto atau tombol untuk memilih file</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhotoChange} />
                  </CardContent>
                </Card>

                <FormSection title="Akun Login" description="NIP digunakan sebagai username login guru.">
                  <Field label="NIP" required><Input name="nip" required value={formData.nip} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Identitas Pribadi">
                  <Field label="Nama Lengkap" required><Input name="full_name" required value={formData.full_name} onChange={handleChange} /></Field>
                  <Field label="Jenis Kelamin" required>
                    <Select value={formData.gender} onValueChange={(v) => handleSelect("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Agama">
                    <Select value={formData.religion} onValueChange={(v) => handleSelect("religion", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih agama" /></SelectTrigger>
                      <SelectContent>
                        {religions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tempat Lahir"><Input name="birth_place" value={formData.birth_place} onChange={handleChange} /></Field>
                  <Field label="Tanggal Lahir"><Input name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} /></Field>
                  <Field label="Kewarganegaraan"><Input name="nationality" value={formData.nationality} onChange={handleChange} /></Field>
                  <Field label="Status Pernikahan">
                    <Select value={formData.marital_status} onValueChange={(v) => handleSelect("marital_status", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        {maritalStatuses.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </FormSection>

                <FormSection title="Dokumen Identitas Nasional">
                  <Field label="NUPTK"><Input name="nuptk" value={formData.nuptk} onChange={handleChange} /></Field>
                  <Field label="NIK (KTP)"><Input name="nik" value={formData.nik} onChange={handleChange} /></Field>
                  <Field label="NPWP"><Input name="npwp" value={formData.npwp} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="kepegawaian" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Data Kepegawaian">
                  <Field label="Status Kepegawaian">
                    <Select value={formData.employee_status} onValueChange={(v) => handleSelect("employee_status", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                      <SelectContent>
                        {employeeStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Jabatan"><Input name="position" value={formData.position} onChange={handleChange} /></Field>
                  <Field label="Mata Pelajaran"><Input name="subject" value={formData.subject} onChange={handleChange} /></Field>
                  <Field label="Jam Mengajar / Minggu"><Input name="teaching_hours" type="number" min="0" value={formData.teaching_hours || ""} onChange={handleChange} /></Field>
                  <Field label="Golongan / Pangkat"><Input name="rank" value={formData.rank} onChange={handleChange} /></Field>
                  <Field label="No. SK Pengangkatan"><Input name="sk_number" value={formData.sk_number} onChange={handleChange} /></Field>
                  <Field label="Tanggal Mulai Bertugas"><Input name="join_date" type="date" value={formData.join_date} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="pendidikan" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Pendidikan Terakhir">
                  <Field label="Jenjang Pendidikan">
                    <Select value={formData.education_level} onValueChange={v => handleSelect("education_level", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
                      <SelectContent>{educationLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Jurusan / Program Studi"><Input name="education_major" value={formData.education_major} onChange={handleChange} /></Field>
                  <Field label="Nama Universitas"><Input name="university" value={formData.university} onChange={handleChange} /></Field>
                  <Field label="Tahun Lulus"><Input name="graduation_year" type="number" value={formData.graduation_year || ""} onChange={handleChange} /></Field>
                  <Field label="No. Sertifikat Pendidik"><Input name="cert_number" value={formData.cert_number} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="alamat" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Kontak">
                  <Field label="Nomor Telepon / HP"><Input name="phone" value={formData.phone} onChange={handleChange} /></Field>
                  <Field label="Alamat Email"><Input name="email" type="email" value={formData.email} onChange={handleChange} /></Field>
                </FormSection>
                <FormSection title="Alamat Tempat Tinggal">
                  <Field label="Alamat Jalan"><Input name="address" value={formData.address} onChange={handleChange} /></Field>
                  <Field label="RT/RW"><Input name="rt_rw" value={formData.rt_rw} onChange={handleChange} /></Field>
                  <Field label="Kelurahan / Desa"><Input name="village" value={formData.village} onChange={handleChange} /></Field>
                  <Field label="Kecamatan"><Input name="district" value={formData.district} onChange={handleChange} /></Field>
                  <Field label="Kota / Kabupaten"><Input name="city" value={formData.city} onChange={handleChange} /></Field>
                  <Field label="Provinsi"><Input name="province" value={formData.province} onChange={handleChange} /></Field>
                  <Field label="Kode Pos"><Input name="postal_code" value={formData.postal_code} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </div>
    </PageShell>
  )
}
