import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Pencil, Loader2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { useAppDialog } from "../../context/AppDialogContext"
import { resolveAssetUrl } from "@/lib/runtime"

const API = "http://localhost:8080/api"

type ClassItem = {
  id: string
  name: string
  grade_level: number
  academic_year: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  baru: { label: "Baru", className: "bg-blue-100 text-blue-800 border-blue-200" },
  verifikasi_berkas: { label: "Verifikasi Berkas", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  lulus: { label: "Lulus", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cadangan: { label: "Cadangan", className: "bg-orange-100 text-orange-800 border-orange-200" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-800 border-red-200" },
  daftar_ulang: { label: "Daftar Ulang", className: "bg-purple-100 text-purple-800 border-purple-200" },
}

export default function PPDBShow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialog = useAppDialog()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState<any>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])

  const [statusDraft, setStatusDraft] = useState("")
  const [notesDraft, setNotesDraft] = useState("")
  const [convertDraft, setConvertDraft] = useState({ nis: "", password: "", gender: "L", class_id: "", enrollment_date: "" })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [appRes, classesRes] = await Promise.all([
        axios.get(`${API}/ppdb/applications/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        axios.get(`${API}/classes`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
      ])
      const data = appRes.data
      setApp(data)
      setStatusDraft(data.status)
      setNotesDraft(data.notes_panitia || "")
      setConvertDraft({ nis: "", password: "", gender: data.gender || "L", class_id: "", enrollment_date: "" })
      setClasses(classesRes.data.data || [])
    } catch (err: any) {
      await dialog.alert("Gagal memuat data pendaftar")
      navigate("/ppdb")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const saveStatus = async () => {
    try {
      await axios.put(`${API}/ppdb/applications/${id}/status`,
        { status: statusDraft, notes_panitia: notesDraft },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      await dialog.alert("Status pendaftar berhasil diperbarui")
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal memperbarui status PPDB")
    }
  }

  const convertToStudent = async () => {
    if (!convertDraft.nis || !convertDraft.password || !convertDraft.gender) {
      await dialog.alert("Isi NIS, password, dan gender terlebih dahulu")
      return
    }
    const ok = await dialog.confirm("Konversi pendaftar ini menjadi siswa aktif?")
    if (!ok) return
    try {
      await axios.post(`${API}/ppdb/applications/${id}/convert`, convertDraft, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      await dialog.alert("Pendaftar berhasil dikonversi menjadi siswa")
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal mengonversi pendaftar")
    }
  }

  if (loading || !app) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = statusConfig[app.status] || { label: app.status, className: "bg-gray-100 text-gray-800 border-gray-200" }

  return (
    <div className="animate-fade-in flex flex-col">
      {/* Page Header */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/ppdb"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Detail Pendaftar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Review kelengkapan berkas dan tindak lanjut pendaftar.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 space-y-6 pb-8">
        {/* Summary Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{app.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">No Pendaftaran: {app.registration_no}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${status.className}`}>{status.label}</span>
              {app.converted_student_id && (
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SISWA AKTIF (ID: {app.converted_student_id})
                </span>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2 shadow-xs">
            <Link to={`/ppdb/${app.id}/edit`}><Pencil className="h-3.5 w-3.5" /> Edit Data</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Data Detail */}
          <div className="md:col-span-2 space-y-5">
            {/* Data Pribadi */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-800">Data Pribadi</h3>
              </div>
              <div className="p-5">
                <table className="text-sm w-full">
                  <tbody>
                    {[
                      ["NISN", app.nisn || "—"],
                      ["TTL", `${app.place_of_birth || "—"}, ${app.birth_date}`],
                      ["Gender", app.gender === "L" ? "Laki-laki" : app.gender === "P" ? "Perempuan" : "—"],
                      ["Agama", app.religion || "—"],
                      ["Alamat Lengkap", app.address || "—"],
                      ["Asal Sekolah", app.previous_school || "—"],
                    ].map(([label, val]) => (
                      <tr key={label} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-muted-foreground w-1/3">{label}</td>
                        <td className="py-2.5 font-medium">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Orang Tua */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-800">Data Orang Tua / Wali</h3>
              </div>
              <div className="p-5">
                <table className="text-sm w-full">
                  <tbody>
                    {[
                      ["Kontak Utama", app.parent_phone || "—"],
                      ["Nama Ayah", app.father_name || "—"],
                      ["Pekerjaan Ayah", app.father_occupation || "—"],
                      ["No. HP Ayah", app.father_phone || "—"],
                      ["Nama Ibu", app.mother_name || "—"],
                      ["Pekerjaan Ibu", app.mother_occupation || "—"],
                      ["No. HP Ibu", app.mother_phone || "—"],
                      ["Penghasilan Ortu", app.parent_income || "—"],
                    ].map(([label, val]) => (
                      <tr key={label} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-muted-foreground w-1/3">{label}</td>
                        <td className="py-2.5 font-medium">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Berkas Digital */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-800">Berkas Digital</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Kartu Keluarga (KK)", url: app.document_kk },
                    { label: "Akte Kelahiran", url: app.document_akta },
                  ].map(({ label, url }) => (
                    <div key={label} className="border border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
                      {url ? (
                        <a href={resolveAssetUrl(url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium px-3 py-1.5 bg-blue-50 rounded-md inline-block">
                          Buka Dokumen
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Tidak dilampirkan</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Panels */}
          <div className="space-y-5">
            {/* Status Update */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-blue-800">Update Status Seleksi</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ubah Status</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                    <option value="baru">Baru</option>
                    <option value="verifikasi_berkas">Verifikasi Berkas</option>
                    <option value="lulus">Lulus</option>
                    <option value="cadangan">Cadangan</option>
                    <option value="ditolak">Ditolak</option>
                    <option value="daftar_ulang">Daftar Ulang</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Catatan Panitia</Label>
                  <Input value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder="Tulis catatan..." className="bg-transparent shadow-xs" />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={saveStatus}>Simpan Status</Button>
              </div>
            </div>

            {/* Convert to Student */}
            <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${app.converted_student_id ? "border-slate-200" : "border-emerald-200"}`}>
              <div className={`border-b px-5 py-3 ${app.converted_student_id ? "bg-slate-50 border-slate-200" : "bg-emerald-50 border-emerald-100"}`}>
                <h3 className={`text-sm font-semibold ${app.converted_student_id ? "text-slate-500" : "text-emerald-800"}`}>Konversi Jadi Siswa Aktif</h3>
              </div>
              <div className="p-5">
                {!app.converted_student_id ? (
                  <div className="space-y-4">
                    {statusDraft !== "lulus" && statusDraft !== "daftar_ulang" && (
                      <p className="text-xs text-orange-600 bg-orange-50 p-3 rounded-lg">⚠️ Status saat ini bukan "Lulus" atau "Daftar Ulang".</p>
                    )}
                    <div className="space-y-2"><Label className="text-xs font-bold">NIS Baru <span className="text-red-500">*</span></Label><Input value={convertDraft.nis} onChange={e => setConvertDraft(p => ({ ...p, nis: e.target.value }))} className="shadow-xs" /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold">Password Login <span className="text-red-500">*</span></Label><Input type="password" value={convertDraft.password} onChange={e => setConvertDraft(p => ({ ...p, password: e.target.value }))} className="shadow-xs" /></div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Gender <span className="text-red-500">*</span></Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs" value={convertDraft.gender} onChange={e => setConvertDraft(p => ({ ...p, gender: e.target.value }))}>
                        <option value="L">Laki-Laki</option><option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Pilih Kelas</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs" value={convertDraft.class_id} onChange={e => setConvertDraft(p => ({ ...p, class_id: e.target.value }))}>
                        <option value="">(Tanpa Kelas)</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.academic_year}</option>)}
                      </select>
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2" onClick={convertToStudent}>Proses Konversi</Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-emerald-600 font-bold mb-1">✓ SUDAH DIKONVERSI</p>
                    <p className="text-xs text-muted-foreground">Siswa ini telah aktif dan memiliki ID Student.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
