import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Pencil, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Skeleton } from "../../components/ui/skeleton"
import { DataTable } from "../../components/DataTable"
import { sppPaymentColumns, type SppPayment } from "../spp/columns"
import { useAuth } from "../../context/AuthContext"

interface StudentDetail {
  id: string
  nis: string
  nisn: string
  full_name: string
  gender: string
  birth_place: string
  birth_date: string
  phone: string
  address: string
  parent_name: string
  parent_phone: string
  enrollment_date: string
  is_active: boolean
  photo_url?: string
  exit_type?: string
  exit_date?: string
  exit_reason?: string
  religion?: string
  nationality?: string
  birth_certificate_no?: string
  kk_number?: string
  pip_number?: string
  pip_reason?: string
  child_order?: number
  num_siblings?: number
  living_with?: string
  transportation?: string
  special_needs?: string
  rt_rw?: string
  village?: string
  district?: string
  city?: string
  province?: string
  postal_code?: string
  father_name?: string
  father_is_alive?: boolean
  father_nik?: string
  father_birth_year?: number
  father_education?: string
  father_occupation?: string
  father_income?: number
  mother_name?: string
  mother_is_alive?: boolean
  mother_nik?: string
  mother_birth_year?: number
  mother_education?: string
  mother_occupation?: string
  mother_income?: number
  guardian_name?: string
  guardian_relation?: string
  guardian_occupation?: string
  guardian_phone?: string
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  )
}

export default function StudentShow() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const backHref = user?.role === "guru" ? "/classes" : "/siswa"
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [sppPayments, setSppPayments] = useState<SppPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, sppRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/students/${id}`),
          axios.get(`http://localhost:8080/api/spp/student/${id}`).catch(() => ({ data: { payments: [] } }))
        ])
        setStudent(studentRes.data)
        setSppPayments(sppRes.data.payments || [])
      } catch (error) {
        console.error("Gagal mengambil data siswa:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
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

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="h-12 w-12 rounded-none-none bg-muted flex items-center justify-center">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Siswa tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">Data siswa mungkin telah dihapus.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={backHref}>Kembali</Link>
        </Button>
      </div>
    )
  }

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"

  return (
    <PageShell
      title="Detail Profil Siswa"
      description="Detail informasi lengkap siswa."
      backButton={
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
          <Link to={backHref}>
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
        </Button>
      }
      actions={
        <Button asChild size="sm" variant="outline" className="gap-2 shadow-xs">
          <Link to={`/siswa/${student.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" /> Ubah Data
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-6 w-full">
          {/* Avatar Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start p-6 gap-6 w-full">
            <div className="h-24 w-24 rounded-full bg-muted border-4 border-background shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              {student.photo_url ? (
                <img src={`http://localhost:8080${student.photo_url}`} alt={student.full_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col items-center sm:items-start flex-1 gap-2">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-foreground leading-tight">{student.full_name}</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono">NIS: {student.nis} {student.nisn ? `| NISN: ${student.nisn}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                <Badge variant={student.is_active ? "default" : "secondary"} className="text-xs">
                  {student.is_active ? "Aktif" : "Non-aktif"}
                </Badge>
                {student.exit_type && <Badge variant="destructive" className="text-xs uppercase">{student.exit_type.replace("_", " ")}</Badge>}
              </div>
            </div>
          </div>

          <Tabs defaultValue="profil" className="w-full flex-1 flex flex-col">
            <div className="border-b px-2">
              <TabsList className="bg-transparent h-12 p-0 w-full justify-start overflow-x-auto rounded-none border-b-0 gap-6">
                <TabsTrigger value="profil" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Profil & Identitas</TabsTrigger>
                <TabsTrigger value="sosial" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Sosial & Alamat</TabsTrigger>
                <TabsTrigger value="keluarga" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Data Orang Tua & Wali</TabsTrigger>
                <TabsTrigger value="spp" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2">Pembayaran SPP</TabsTrigger>
              </TabsList>
            </div>

            <div className="pt-6">
              <TabsContent value="profil" className="m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Informasi Dasar</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow label="Nama Lengkap" value={student.full_name} />
                      <InfoRow label="Jenis Kelamin" value={student.gender === "L" ? "Laki-laki" : "Perempuan"} />
                      <InfoRow label="Tempat, Tgl Lahir" value={`${student.birth_place || "—"}, ${formatDate(student.birth_date)}`} />
                      <InfoRow label="Agama" value={student.religion} />
                      <InfoRow label="Kewarganegaraan" value={student.nationality} />
                      <InfoRow label="Nomor Telepon" value={student.phone} />
                      <div className="sm:col-span-2"><InfoRow label="Tanggal Masuk" value={formatDate(student.enrollment_date)} /></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Dokumen & Akademik</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow label="NIS" value={student.nis} />
                      <InfoRow label="NISN" value={student.nisn} />
                      <InfoRow label="No. Akta Kelahiran" value={student.birth_certificate_no} />
                      <InfoRow label="No. Kartu Keluarga" value={student.kk_number} />
                      <div className="sm:col-span-2"><InfoRow label="No. PIP / KIP" value={student.pip_number} /></div>
                      <div className="sm:col-span-2"><InfoRow label="Alasan Menerima PIP" value={student.pip_reason} /></div>
                    </div>
                  </div>

                  {student.exit_type && (
                    <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm overflow-hidden md:col-span-2">
                      <div className="bg-red-100 border-b border-red-200 px-4 py-3"><h4 className="text-sm font-semibold text-red-800">Status Keluar</h4></div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InfoRow label="Jenis Keluar" value={student.exit_type?.replace("_", " ")} />
                        <InfoRow label="Tanggal Keluar" value={formatDate(student.exit_date)} />
                        <InfoRow label="Alasan / Keterangan" value={student.exit_reason} />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sosial" className="m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Kondisi Sosial</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow label="Anak ke-" value={student.child_order?.toString()} />
                      <InfoRow label="Jumlah Saudara" value={student.num_siblings?.toString()} />
                      <InfoRow label="Tinggal Bersama" value={student.living_with} />
                      <InfoRow label="Transportasi" value={student.transportation} />
                      <div className="sm:col-span-2"><InfoRow label="Kebutuhan Khusus" value={student.special_needs} /></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Alamat Domisili</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><InfoRow label="Alamat Jalan" value={student.address} /></div>
                      <InfoRow label="RT/RW" value={student.rt_rw} />
                      <InfoRow label="Kelurahan / Desa" value={student.village} />
                      <InfoRow label="Kecamatan" value={student.district} />
                      <InfoRow label="Kabupaten / Kota" value={student.city} />
                      <InfoRow label="Provinsi" value={student.province} />
                      <InfoRow label="Kode Pos" value={student.postal_code} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="keluarga" className="m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Data Ayah Kandung</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 flex items-center justify-between">
                        <InfoRow label="Nama Ayah" value={student.father_name} />
                        <Badge variant="outline">{student.father_is_alive ? "Masih Hidup" : "Meninggal"}</Badge>
                      </div>
                      <InfoRow label="NIK Ayah" value={student.father_nik} />
                      <InfoRow label="Tahun Lahir" value={student.father_birth_year?.toString()} />
                      <InfoRow label="Pendidikan Terakhir" value={student.father_education?.toUpperCase()} />
                      <InfoRow label="Pekerjaan" value={student.father_occupation} />
                      <InfoRow label="Penghasilan Bulanan" value={student.father_income ? `Rp ${student.father_income.toLocaleString('id-ID')}` : undefined} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Data Ibu Kandung</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 flex items-center justify-between">
                        <InfoRow label="Nama Ibu" value={student.mother_name} />
                        <Badge variant="outline">{student.mother_is_alive ? "Masih Hidup" : "Meninggal"}</Badge>
                      </div>
                      <InfoRow label="NIK Ibu" value={student.mother_nik} />
                      <InfoRow label="Tahun Lahir" value={student.mother_birth_year?.toString()} />
                      <InfoRow label="Pendidikan Terakhir" value={student.mother_education?.toUpperCase()} />
                      <InfoRow label="Pekerjaan" value={student.mother_occupation} />
                      <InfoRow label="Penghasilan Bulanan" value={student.mother_income ? `Rp ${student.mother_income.toLocaleString('id-ID')}` : undefined} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
                    <div className="bg-slate-50 border-b px-4 py-3"><h4 className="text-sm font-semibold text-slate-800">Kontak & Wali</h4></div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="col-span-2 sm:col-span-1 lg:col-span-2"><InfoRow label="Kontak Darurat Orang Tua" value={`${student.parent_name || '—'} (${student.parent_phone || '—'})`} /></div>
                      <div className="col-span-2"><Separator className="my-2" /></div>
                      <InfoRow label="Nama Wali" value={student.guardian_name} />
                      <InfoRow label="Hubungan Wali" value={student.guardian_relation} />
                      <InfoRow label="Pekerjaan Wali" value={student.guardian_occupation} />
                      <InfoRow label="Telepon Wali" value={student.guardian_phone} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="spp" className="m-0 focus-visible:outline-none">

                <DataTable
                  columns={sppPaymentColumns}
                  data={sppPayments}
                  pageCount={1}
                  pageIndex={0}
                  onPageChange={() => { }}
                />

              </TabsContent>
            </div>
          </Tabs>
        </div>
    </PageShell>
  )
}
