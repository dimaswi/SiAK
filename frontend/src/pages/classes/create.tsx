import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Save } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
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

export default function ClassCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdmin = user?.role === "admin" || user?.role === "kepala_sekolah"

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    grade_level: "10",
    academic_year: "2025/2026",
    homeroom_teacher_id: ""
  })

  useEffect(() => {
    if (!isAdmin) {
      navigate("/classes")
      return
    }

    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${API}/teachers?limit=100`)
        setTeachers(res.data.data || [])
      } catch (err) {
        console.error("Gagal mengambil data guru")
      }
    }
    fetchTeachers()
  }, [isAdmin, navigate])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await axios.post(`${API}/classes`, {
        name: formData.name,
        grade_level: parseInt(formData.grade_level),
        academic_year: formData.academic_year,
        homeroom_teacher_id: formData.homeroom_teacher_id
      })
      navigate("/classes")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal membuat kelas")
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Tambah Kelas Baru"
      description="Buat kelas baru dan tentukan tingkat serta wali kelasnya."
      backButton={
        <Button variant="outline" size="icon" className="rounded-none shrink-0" asChild>
          <Link to="/classes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
      }
      footer={
        <>
          <Button type="button" variant="outline" asChild>
            <Link to="/classes">Batal</Link>
          </Button>
          <Button type="submit" form="class-form" disabled={isSubmitting} className="gap-2 min-w-[140px]">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan Kelas"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="class-form" onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Kelas</Label>
                <Input required placeholder="Contoh: X MIPA 1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tingkat Kelas (Grade)</Label>
                  <Select value={formData.grade_level} onValueChange={v => setFormData({ ...formData, grade_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Kelas 1 (SD)</SelectItem>
                      <SelectItem value="2">Kelas 2 (SD)</SelectItem>
                      <SelectItem value="3">Kelas 3 (SD)</SelectItem>
                      <SelectItem value="4">Kelas 4 (SD)</SelectItem>
                      <SelectItem value="5">Kelas 5 (SD)</SelectItem>
                      <SelectItem value="6">Kelas 6 (SD)</SelectItem>
                      <SelectItem value="7">Kelas 7 (SMP)</SelectItem>
                      <SelectItem value="8">Kelas 8 (SMP)</SelectItem>
                      <SelectItem value="9">Kelas 9 (SMP)</SelectItem>
                      <SelectItem value="10">Kelas 10 (SMA)</SelectItem>
                      <SelectItem value="11">Kelas 11 (SMA)</SelectItem>
                      <SelectItem value="12">Kelas 12 (SMA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
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
                <Label>Wali Kelas (Opsional)</Label>
                <Select value={formData.homeroom_teacher_id || "none"} onValueChange={v => setFormData({ ...formData, homeroom_teacher_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Wali Kelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum Ditentukan</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
