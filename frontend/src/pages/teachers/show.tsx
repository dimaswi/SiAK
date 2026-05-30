import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Pencil, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"

interface TeacherDetail {
  id: string
  nip: string
  full_name: string
  gender: string
  birth_place: string
  birth_date: string
  address: string
  phone: string
  email: string
  subject: string
  rank: string
  join_date: string
  is_active: boolean
  nuptk?: string
  nik?: string
  npwp?: string
  religion?: string
  nationality?: string
  marital_status?: string
  employee_status?: string
  position?: string
  teaching_hours?: number
  sk_number?: string
  education_level?: string
  education_major?: string
  university?: string
  graduation_year?: number
  cert_number?: string
  rt_rw?: string
  village?: string
  district?: string
  city?: string
  province?: string
  postal_code?: string
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  )
}

export default function TeacherShow() {
  const { id } = useParams<{ id: string }>()
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/teachers/${id}`)
        setTeacher(response.data.data || response.data)
      } catch (error) {
        console.error("Gagal mengambil data guru:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTeacher()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl px-4 md:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-52" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Guru tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">Data guru mungkin telah dihapus.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/guru">Kembali ke Daftar Guru</Link>
        </Button>
      </div>
    )
  }

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"

  return (
    <PageShell
      title="Detail Profil Guru"
      description="Detail informasi lengkap guru."
      backButton={
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
          <Link to="/guru">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
        </Button>
      }
      actions={
        <Button asChild size="sm" variant="outline" className="gap-2 shadow-xs">
          <Link to={`/guru/${teacher.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" /> Ubah Data
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Avatar Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start p-6 gap-6 w-full">
          <div className="h-24 w-24 rounded-full bg-muted border-4 border-background shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-center sm:items-start flex-1 gap-2">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground leading-tight">{teacher.full_name}</h2>
              <p className="text-sm text-muted-foreground mt-1 font-mono">NIP: {teacher.nip} {teacher.nuptk ? `| NUPTK: ${teacher.nuptk}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
              <Badge variant={teacher.is_active ? "default" : "secondary"} className="text-xs">
                {teacher.is_active ? "Aktif" : "Non-aktif"}
              </Badge>
              {teacher.employee_status && <Badge variant="outline" className="text-xs capitalize">{teacher.employee_status.replace("_", " ")}</Badge>}
              {teacher.subject && <Badge variant="secondary" className="text-xs">{teacher.subject}</Badge>}
            </div>
          </div>
        </div>

        <Tabs defaultValue="profil" className="w-full flex-1 flex flex-col">
          <div className="border-b px-2">
            <TabsList className="bg-transparent h-12 p-0 w-full justify-start overflow-x-auto rounded-none border-b-0 gap-6">
              <TabsTrigger value="profil" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Profil Pribadi</TabsTrigger>
              <TabsTrigger value="kepegawaian" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Data Kepegawaian</TabsTrigger>
              <TabsTrigger value="pendidikan" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Pendidikan & Sertifikasi</TabsTrigger>
              <TabsTrigger value="alamat" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Alamat & Kontak</TabsTrigger>
            </TabsList>
          </div>

          <div className="pt-6">
            <TabsContent value="profil" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Informasi Dasar</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Nama Lengkap" value={teacher.full_name} />
                    <InfoRow label="Jenis Kelamin" value={teacher.gender === "L" ? "Laki-laki" : "Perempuan"} />
                    <InfoRow label="Tempat, Tgl Lahir" value={`${teacher.birth_place || "—"}, ${formatDate(teacher.birth_date)}`} />
                    <InfoRow label="Agama" value={teacher.religion} />
                    <InfoRow label="Status Perkawinan" value={teacher.marital_status?.replace("_", " ")} />
                    <InfoRow label="Kewarganegaraan" value={teacher.nationality} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Dokumen Identitas</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="NIK (No. KTP)" value={teacher.nik} />
                    <InfoRow label="NUPTK" value={teacher.nuptk} />
                    <InfoRow label="NPWP" value={teacher.npwp} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kepegawaian" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Penugasan & Jabatan</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Status Kepegawaian" value={teacher.employee_status?.replace("_", " ")} />
                    <InfoRow label="Jabatan" value={teacher.position} />
                    <InfoRow label="Mata Pelajaran" value={teacher.subject} />
                    <InfoRow label="Jam Mengajar" value={teacher.teaching_hours ? `${teacher.teaching_hours} Jam/Minggu` : ""} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Informasi SK</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Golongan / Pangkat" value={teacher.rank} />
                    <InfoRow label="TMT (Tanggal Mulai Tugas)" value={formatDate(teacher.join_date)} />
                    <div className="sm:col-span-2"><InfoRow label="No. SK Pengangkatan" value={teacher.sk_number} /></div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pendidikan" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Riwayat Pendidikan Terakhir</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoRow label="Jenjang" value={teacher.education_level?.toUpperCase()} />
                    <InfoRow label="Jurusan / Prodi" value={teacher.education_major} />
                    <InfoRow label="Universitas / Institusi" value={teacher.university} />
                    <InfoRow label="Tahun Lulus" value={teacher.graduation_year?.toString()} />
                    <div className="sm:col-span-2"><InfoRow label="No. Sertifikat Pendidik" value={teacher.cert_number} /></div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alamat" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Kontak Aktif</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Nomor Telepon / HP" value={teacher.phone} />
                    <InfoRow label="Email" value={teacher.email} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Alamat Domisili</h4></div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><InfoRow label="Alamat Jalan" value={teacher.address} /></div>
                    <InfoRow label="RT/RW" value={teacher.rt_rw} />
                    <InfoRow label="Kelurahan / Desa" value={teacher.village} />
                    <InfoRow label="Kecamatan" value={teacher.district} />
                    <InfoRow label="Kabupaten / Kota" value={teacher.city} />
                    <InfoRow label="Provinsi" value={teacher.province} />
                    <InfoRow label="Kode Pos" value={teacher.postal_code} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageShell>
  )
}
