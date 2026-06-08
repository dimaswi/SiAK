import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Loader2, Save, Camera, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useAuth } from "../../context/AuthContext"
import { resolveAssetUrl } from "@/lib/runtime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
const schoolStatusOptions = ["Negeri", "Swasta"]
const achievementLevels = ["Tingkat Sekolah", "Tingkat Kecamatan", "Tingkat Kabupaten/Kota", "Tingkat Provinsi", "Tingkat Nasional", "Tingkat Internasional"]
const scholarshipStatusOptions = ["Aktif", "Tidak Aktif"]
const scholarshipSources = ["Pemerintah Pusat", "Pemerintah Daerah", "Sekolah", "Swasta", "Lainnya"]

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  )
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
      {children}
    </div>
  )
}

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const backHref = user?.role === "guru" ? "/classes" : "/siswa"
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<Record<string, any>>({
    nis: "", nism: "", nisn: "", nik: "", full_name: "", gender: "L",
    birth_place: "", birth_date: "", religion: "", nationality: "WNI",
    birth_certificate_no: "", kk_number: "",
    
    kks_number: "", kps_number: "", kip_number: "", pkh_number: "", kis_number: "",
    is_pip_receiver: false, pip_number: "", pip_reason: "", pip_period: "",
    
    child_order: 0, num_siblings: 0, living_with: "", transportation: "", special_needs: "",
    hobby: "", ambition: "",
    
    address: "", rt_rw: "", village: "", district: "", city: "", province: "", postal_code: "",
    phone: "", enrollment_date: "",
    
    class_absent_number: "", class_rank: 0,
    
    achievement_field: "", achievement_level: "", achievement_rank: "", achievement_year: 0,
    scholarship_status: "", scholarship_source: "", scholarship_type: "", scholarship_duration_months: 0, scholarship_amount: 0,
    
    previous_school_type: "", previous_school_status: "", previous_school_city: "",
    
    father_name: "", father_nik: "", father_birth_year: 0, father_birth_date: "",
    father_education: "", father_occupation: "", father_income: 0, father_is_alive: true,
    mother_name: "", mother_nik: "", mother_birth_year: 0, mother_birth_date: "",
    mother_education: "", mother_occupation: "", mother_income: 0, mother_is_alive: true,
    parent_name: "", parent_phone: "",
    guardian_name: "", guardian_nik: "", guardian_phone: "", guardian_occupation: "", guardian_relation: "",
    
    exit_type: "", exit_date: "", exit_reason: "",
  })

  useEffect(() => {
    axios.get(`${API}/students/${id}`).then(res => {
      const data = res.data
      const stripTime = (d: string) => d ? d.split("T")[0] : ""
      data.birth_date = stripTime(data.birth_date)
      data.enrollment_date = stripTime(data.enrollment_date)
      data.exit_date = stripTime(data.exit_date)
      data.father_birth_date = stripTime(data.father_birth_date)
      data.mother_birth_date = stripTime(data.mother_birth_date)
      if (data.photo_url) setPhotoPreview(resolveAssetUrl(data.photo_url))
      setFormData(prev => ({ ...prev, ...data }))
    }).catch(() => { setError("Siswa tidak ditemukan."); navigate(backHref) }).finally(() => setIsLoading(false))
  }, [id, navigate, backHref])

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
      await axios.put(`${API}/students/${id}`, formData)
      if (photoFile) {
        const fd = new FormData(); fd.append("photo", photoFile)
        await axios.post(`${API}/upload/photo?entity_type=student&entity_id=${id}`, fd)
      }
      navigate(`/siswa/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.")
    } finally { setIsSubmitting(false) }
  }

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="animate-fade-in flex flex-col flex-1">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to={backHref}><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ubah Data Siswa</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Perbarui informasi profil siswa sesuai standar Dapodik.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        <form id="student-form" onSubmit={handleSubmit} className="flex flex-col flex-1 h-full relative">
          <Tabs defaultValue="profil" className="w-full flex-1 flex flex-col gap-6">
            <div className="border-b px-2 overflow-x-auto">
              <TabsList className="bg-transparent h-12 p-0 justify-start rounded-none border-b-0 gap-6 w-max min-w-full">
                <TabsTrigger value="profil" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Profil & Identitas</TabsTrigger>
                <TabsTrigger value="sosial" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Sosial & Alamat</TabsTrigger>
                <TabsTrigger value="akademik" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Akademik & Sekolah</TabsTrigger>
                <TabsTrigger value="bantuan" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Bantuan & Prestasi</TabsTrigger>
                <TabsTrigger value="keluarga" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Data Orang Tua & Wali</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 pb-24">
              <TabsContent value="profil" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-slate-800">Foto Profil</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">Format JPG, PNG, atau WebP. Maks 5MB.</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {photoPreview ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-muted-foreground" />}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera className="h-5 w-5 text-white" /></div>
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Pilih Foto</Button>
                      <p className="text-xs text-muted-foreground mt-2">Klik foto atau tombol untuk memilih file</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhotoChange} />
                  </div>
                </div>

                <FormSection title="Identitas Akademik" description="NIS digunakan sebagai username login siswa.">
                  <Field label="NIS" required><Input name="nis" required value={formData.nis} onChange={handleChange} /></Field>
                  <Field label="NISM"><Input name="nism" placeholder="Nomor Induk Siswa Madrasah" value={formData.nism} onChange={handleChange} /></Field>
                  <Field label="NISN"><Input name="nisn" placeholder="Nomor Induk Siswa Nasional" value={formData.nisn} onChange={handleChange} /></Field>
                  <Field label="NIK"><Input name="nik" placeholder="16 Digit NIK KTP Siswa" value={formData.nik} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Identitas Pribadi">
                  <Field label="Nama Lengkap" required><Input name="full_name" required value={formData.full_name} onChange={handleChange} /></Field>
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
                  <Field label="Tempat Lahir"><Input name="birth_place" value={formData.birth_place} onChange={handleChange} /></Field>
                  <Field label="Tanggal Lahir"><Input name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} /></Field>
                  <Field label="Kewarganegaraan"><Input name="nationality" value={formData.nationality} onChange={handleChange} /></Field>
                  <Field label="Telepon Siswa"><Input name="phone" value={formData.phone} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Dokumen Identitas">
                  <Field label="No. Akta Kelahiran"><Input name="birth_certificate_no" value={formData.birth_certificate_no} onChange={handleChange} /></Field>
                  <Field label="No. Kartu Keluarga (KK)"><Input name="kk_number" value={formData.kk_number} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Status Keluar (Isi jika siswa keluar)">
                  <Field label="Jenis Keluar">
                    <Select value={formData.exit_type} onValueChange={v => handleSelect("exit_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lulus">Lulus</SelectItem>
                        <SelectItem value="pindah">Pindah Sekolah</SelectItem>
                        <SelectItem value="putus_sekolah">Putus Sekolah / DO</SelectItem>
                        <SelectItem value="meninggal">Meninggal Dunia</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tanggal Keluar"><Input name="exit_date" type="date" value={formData.exit_date} onChange={handleChange} /></Field>
                  <Field label="Keterangan / Alasan"><Input name="exit_reason" value={formData.exit_reason} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="sosial" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Data Sosial">
                  <Field label="Anak ke-"><Input name="child_order" type="number" min="1" value={formData.child_order || ""} onChange={handleChange} /></Field>
                  <Field label="Jumlah Saudara Kandung"><Input name="num_siblings" type="number" min="0" value={formData.num_siblings || ""} onChange={handleChange} /></Field>
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
                  <Field label="Hobi"><Input name="hobby" placeholder="Membaca, Olahraga..." value={formData.hobby} onChange={handleChange} /></Field>
                  <Field label="Cita-cita"><Input name="ambition" placeholder="Dokter, Polisi..." value={formData.ambition} onChange={handleChange} /></Field>
                  <Field label="Kebutuhan Khusus"><Input name="special_needs" value={formData.special_needs} onChange={handleChange} /></Field>
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

              <TabsContent value="akademik" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Asal Sekolah Sebelumnya (TK/RA)">
                  <Field label="Nama/Jenis Sekolah Asal"><Input name="previous_school_type" placeholder="Cth: TK ABA 1" value={formData.previous_school_type} onChange={handleChange} /></Field>
                  <Field label="Status Sekolah Asal">
                    <Select value={formData.previous_school_status} onValueChange={v => handleSelect("previous_school_status", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                      <SelectContent>{schoolStatusOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Kabupaten/Kota Sekolah Asal"><Input name="previous_school_city" value={formData.previous_school_city} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Data Akademik Saat Ini">
                  <Field label="Tanggal Masuk Sekolah"><Input name="enrollment_date" type="date" value={formData.enrollment_date} onChange={handleChange} /></Field>
                  <Field label="Nomor Absen di Kelas"><Input name="class_absent_number" value={formData.class_absent_number} onChange={handleChange} /></Field>
                  <Field label="Rangking di Kelas"><Input name="class_rank" type="number" min="0" value={formData.class_rank || ""} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="bantuan" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <FormSection title="Kartu Bantuan Sosial">
                  <Field label="Nomor KKS"><Input name="kks_number" value={formData.kks_number} onChange={handleChange} /></Field>
                  <Field label="Nomor KPS"><Input name="kps_number" value={formData.kps_number} onChange={handleChange} /></Field>
                  <Field label="Nomor KIP"><Input name="kip_number" value={formData.kip_number} onChange={handleChange} /></Field>
                  <Field label="Nomor Kartu PKH"><Input name="pkh_number" value={formData.pkh_number} onChange={handleChange} /></Field>
                  <Field label="Nomor KIS"><Input name="kis_number" value={formData.kis_number} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Program Indonesia Pintar (PIP/BSM)">
                  <div className="space-y-2 flex flex-col justify-center h-full pt-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="is_pip_receiver" name="is_pip_receiver" checked={formData.is_pip_receiver} onChange={handleChange} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="is_pip_receiver">Siswa adalah Penerima PIP/BSM</Label>
                    </div>
                  </div>
                  <Field label="Nomor PIP / BSM"><Input name="pip_number" value={formData.pip_number} onChange={handleChange} disabled={!formData.is_pip_receiver} /></Field>
                  <Field label="Alasan Menerima PIP/BSM"><Input name="pip_reason" value={formData.pip_reason} onChange={handleChange} disabled={!formData.is_pip_receiver} /></Field>
                  <Field label="Periode Menerima PIP/BSM"><Input name="pip_period" placeholder="Tahun/Periode" value={formData.pip_period} onChange={handleChange} disabled={!formData.is_pip_receiver} /></Field>
                </FormSection>

                <FormSection title="Prestasi Tertinggi">
                  <Field label="Bidang Prestasi"><Input name="achievement_field" placeholder="Akademik/Olahraga/Seni" value={formData.achievement_field} onChange={handleChange} /></Field>
                  <Field label="Tingkat Prestasi">
                    <Select value={formData.achievement_level} onValueChange={v => handleSelect("achievement_level", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih tingkat" /></SelectTrigger>
                      <SelectContent>{achievementLevels.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Peringkat yang Diraih"><Input name="achievement_rank" placeholder="Juara 1" value={formData.achievement_rank} onChange={handleChange} /></Field>
                  <Field label="Tahun Meraih Prestasi"><Input name="achievement_year" type="number" placeholder="2023" value={formData.achievement_year || ""} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Beasiswa (Selain PIP/BSM)">
                  <Field label="Status Beasiswa">
                    <Select value={formData.scholarship_status} onValueChange={v => handleSelect("scholarship_status", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                      <SelectContent>{scholarshipStatusOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Sumber Beasiswa">
                    <Select value={formData.scholarship_source} onValueChange={v => handleSelect("scholarship_source", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih sumber" /></SelectTrigger>
                      <SelectContent>{scholarshipSources.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Jenis Beasiswa"><Input name="scholarship_type" placeholder="Prestasi/Bakat" value={formData.scholarship_type} onChange={handleChange} /></Field>
                  <Field label="Besar Uang Diterima (Rp)"><Input name="scholarship_amount" type="number" placeholder="0" value={formData.scholarship_amount || ""} onChange={handleChange} /></Field>
                  <Field label="Jangka Waktu (Bulan)"><Input name="scholarship_duration_months" type="number" placeholder="12" value={formData.scholarship_duration_months || ""} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>

              <TabsContent value="keluarga" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                <Card className="border bg-card">
                  <CardHeader className="pb-4"><CardTitle className="text-base font-medium">Data Ayah Kandung</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nama Ayah"><Input name="father_name" value={formData.father_name} onChange={handleChange} /></Field>
                    <Field label="NIK Ayah"><Input name="father_nik" value={formData.father_nik} onChange={handleChange} /></Field>
                    <Field label="Tanggal Lahir Ayah"><Input name="father_birth_date" type="date" value={formData.father_birth_date} onChange={handleChange} /></Field>
                    <Field label="Tahun Lahir Ayah"><Input name="father_birth_year" type="number" value={formData.father_birth_year || ""} onChange={handleChange} /></Field>
                    <Field label="Pendidikan Terakhir Ayah">
                      <Select value={formData.father_education} onValueChange={v => handleSelect("father_education", v)}>
                        <SelectTrigger><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
                        <SelectContent>{educationLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Pekerjaan Ayah"><Input name="father_occupation" value={formData.father_occupation} onChange={handleChange} /></Field>
                    <Field label="Penghasilan Bulanan Ayah (Rp)"><Input name="father_income" type="number" min="0" value={formData.father_income || ""} onChange={handleChange} /></Field>
                    <div className="space-y-1.5 flex items-center gap-2 pt-5">
                      <input type="checkbox" id="father_is_alive" name="father_is_alive" checked={formData.father_is_alive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="father_is_alive" className="text-sm cursor-pointer">Ayah masih hidup</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card">
                  <CardHeader className="pb-4"><CardTitle className="text-base font-medium">Data Ibu Kandung</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nama Ibu"><Input name="mother_name" value={formData.mother_name} onChange={handleChange} /></Field>
                    <Field label="NIK Ibu"><Input name="mother_nik" value={formData.mother_nik} onChange={handleChange} /></Field>
                    <Field label="Tanggal Lahir Ibu"><Input name="mother_birth_date" type="date" value={formData.mother_birth_date} onChange={handleChange} /></Field>
                    <Field label="Tahun Lahir Ibu"><Input name="mother_birth_year" type="number" value={formData.mother_birth_year || ""} onChange={handleChange} /></Field>
                    <Field label="Pendidikan Terakhir Ibu">
                      <Select value={formData.mother_education} onValueChange={v => handleSelect("mother_education", v)}>
                        <SelectTrigger><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
                        <SelectContent>{educationLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Pekerjaan Ibu"><Input name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} /></Field>
                    <Field label="Penghasilan Bulanan Ibu (Rp)"><Input name="mother_income" type="number" min="0" value={formData.mother_income || ""} onChange={handleChange} /></Field>
                    <div className="space-y-1.5 flex items-center gap-2 pt-5">
                      <input type="checkbox" id="mother_is_alive" name="mother_is_alive" checked={formData.mother_is_alive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="mother_is_alive" className="text-sm cursor-pointer">Ibu masih hidup</Label>
                    </div>
                  </CardContent>
                </Card>

                <FormSection title="Kontak Utama Orang Tua">
                  <Field label="Nama"><Input name="parent_name" value={formData.parent_name} onChange={handleChange} /></Field>
                  <Field label="No. Telepon"><Input name="parent_phone" value={formData.parent_phone} onChange={handleChange} /></Field>
                </FormSection>

                <FormSection title="Data Wali (Opsional)">
                  <Field label="Nama Wali"><Input name="guardian_name" value={formData.guardian_name} onChange={handleChange} /></Field>
                  <Field label="NIK Wali"><Input name="guardian_nik" value={formData.guardian_nik} onChange={handleChange} /></Field>
                  <Field label="Telepon Wali"><Input name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} /></Field>
                  <Field label="Pekerjaan"><Input name="guardian_occupation" value={formData.guardian_occupation} onChange={handleChange} /></Field>
                  <Field label="Hubungan dengan Siswa"><Input name="guardian_relation" value={formData.guardian_relation} onChange={handleChange} /></Field>
                </FormSection>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild><Link to={`/siswa/${id}`}>Batal</Link></Button>
        <Button type="submit" form="student-form" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  )
}
