import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useAuth } from "../../context/AuthContext"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

interface Teacher {
  id: string
  full_name: string
}

export default function ClassEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdmin = user?.role === "admin" || user?.role === "kepala_sekolah"

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    grade_level: "10",
    academic_year: "",
    homeroom_teacher_id: ""
  })

  useEffect(() => {
    if (!isAdmin) {
      navigate("/classes")
      return
    }

    const fetchData = async () => {
      try {
        const [teachersRes, classRes] = await Promise.all([
          axios.get(`${API}/teachers?limit=100`),
          axios.get(`${API}/classes/${id}`)
        ])
        const teachersList = teachersRes.data.data || []
        setTeachers(teachersList)

        const cls = classRes.data
        // Find teacher ID from name since class GET returns name (if needed we can update backend, but this works)
        const tId = cls.homeroom_teacher_name ? teachersList.find((t: any) => t.full_name === cls.homeroom_teacher_name)?.id : ""

        setFormData({
          name: cls.name,
          grade_level: cls.grade_level.toString(),
          academic_year: cls.academic_year,
          homeroom_teacher_id: tId || ""
        })
      } catch (err) {
        console.error("Gagal mengambil data")
        await dialog.alert("Gagal memuat data kelas")
        navigate("/classes")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id, isAdmin, navigate])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await axios.put(`${API}/classes/${id}`, {
        name: formData.name,
        grade_level: parseInt(formData.grade_level),
        academic_year: formData.academic_year,
        homeroom_teacher_id: formData.homeroom_teacher_id
      })
      navigate("/classes")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal memperbarui kelas")
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="animate-fade-in flex flex-col flex-1">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/classes"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Kelas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Perbarui informasi kelas.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Informasi Kelas</h2>
            <p className="text-sm text-slate-500 mt-1">Perbarui detail kelas ini.</p>
          </div>
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <form id="class-edit-form" onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700">Nama Kelas <span className="text-red-500">*</span></Label>
                <Input required placeholder="Contoh: X MIPA 1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-transparent shadow-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Tingkat Kelas</Label>
                  <Select value={formData.grade_level} onValueChange={v => setFormData({ ...formData, grade_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                        <SelectItem key={n} value={String(n)}>Kelas {n} {n <= 6 ? "(SD)" : n <= 9 ? "(SMP)" : "(SMA)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Tahun Ajaran</Label>
                  <Select value={formData.academic_year} onValueChange={v => setFormData({ ...formData, academic_year: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih Tahun Ajaran" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const year = new Date().getFullYear() - 1 + i
                        const ay = `${year}/${year + 1}`
                        return <SelectItem key={ay} value={ay}>{ay}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Wali Kelas (Opsional)</Label>
                <Select value={formData.homeroom_teacher_id || "none"} onValueChange={v => setFormData({ ...formData, homeroom_teacher_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Wali Kelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum Ditentukan</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild><Link to="/classes">Batal</Link></Button>
        <Button type="submit" form="class-edit-form" disabled={isSubmitting} className="min-w-[140px]">
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  )
}
