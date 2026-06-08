import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Plus, Settings } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { DataTable } from "../../components/DataTable"
import { buildSppSettingColumns, type SppSetting } from "./columns"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

const currentYear = new Date().getFullYear()
const academicYears = [
  `${currentYear - 1}/${currentYear}`,
  `${currentYear}/${currentYear + 1}`,
  `${currentYear + 1}/${currentYear + 2}`,
  `${currentYear + 2}/${currentYear + 3}`,
  `${currentYear + 3}/${currentYear + 4}`,
  `${currentYear + 4}/${currentYear + 5}`,
  `${currentYear + 5}/${currentYear + 6}`,
  `${currentYear + 6}/${currentYear + 7}`,
  `${currentYear + 7}/${currentYear + 8}`,
  `${currentYear + 8}/${currentYear + 9}`,
  `${currentYear + 9}/${currentYear + 10}`,
  `${currentYear + 10}/${currentYear + 11}`,
]

export default function SppSettings() {
  const dialog = useAppDialog()
  const [settings, setSettings] = useState<SppSetting[]>([])
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [targetType, setTargetType] = useState<"global" | "grade" | "class">("global")
  
  const [form, setForm] = useState({
    academic_year: academicYears[0],
    grade_level: "1",
    class_id: "",
    amount: "",
    description: "",
  })

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [setRes, clsRes] = await Promise.all([
        axios.get(`${API}/spp/settings`),
        axios.get(`${API}/classes?limit=1000`)
      ])
      setSettings(setRes.data || [])
      setClasses(clsRes.data?.data || [])
    } catch {
      console.error("Gagal mengambil data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm("Hapus setting SPP ini?")
    if (!confirmed) return
    try {
      await axios.delete(`${API}/spp/settings/${id}`)
      fetchData()
    } catch {
      await dialog.alert("Gagal menghapus setting")
    }
  }

  // Memoize columns so the delete callback reference stays stable
  const columns = useMemo(() => buildSppSettingColumns(handleDelete), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!form.academic_year || !form.amount) {
      setError("Tahun ajaran dan nominal wajib diisi")
      return
    }
    if (targetType === "class" && !form.class_id) {
      setError("Silakan pilih kelas")
      return
    }
    
    setIsSaving(true)
    try {
      const payload: any = {
        academic_year: form.academic_year,
        amount: Number(form.amount),
        description: form.description,
      }
      
      if (targetType === "grade") {
        payload.grade_level = Number(form.grade_level)
      } else if (targetType === "class") {
        payload.class_id = form.class_id
      }
      
      await axios.post(`${API}/spp/settings`, payload)
      setSuccess("Setting SPP berhasil disimpan")
      setForm(prev => ({ ...prev, amount: "", description: "" }))
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan setting")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell
      title="Setting Nominal SPP"
      description="Konfigurasi nominal SPP per tahun ajaran dan tingkat kelas."
      backButton={
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
          <Link to="/spp"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form Tambah ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1">
          <div className="bg-slate-50 border-b px-5 py-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Tambah Setting Baru</h3>
          </div>
          <div className="p-5">
            {error && (
              <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive mb-3">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 mb-3">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Tahun Ajaran <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.academic_year}
                  onValueChange={v => setForm(p => ({ ...p, academic_year: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Target (Berlaku Untuk) <span className="text-destructive">*</span></Label>
                <Select
                  value={targetType}
                  onValueChange={(v: "global" | "grade" | "class") => setTargetType(v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Semua Kelas (Global)</SelectItem>
                    <SelectItem value="grade">Tingkat Kelas Tertentu</SelectItem>
                    <SelectItem value="class">Kelas Spesifik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {targetType === "grade" && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Pilih Tingkat Kelas <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.grade_level}
                    onValueChange={v => setForm(p => ({ ...p, grade_level: v }))}
                  >
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
              )}

              {targetType === "class" && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Pilih Kelas Spesifik <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.class_id}
                    onValueChange={v => setForm(p => ({ ...p, class_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm">
                  Nominal SPP / Bulan (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 250000"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Keterangan</Label>
                <Input
                  placeholder="Cth: SPP reguler kelas X"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <Button type="submit" disabled={isSaving} className="gap-2 mt-1">
                <Plus className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Setting"}
              </Button>
            </form>
          </div>
        </div>

        {/* ── DataTable Setting ─────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <DataTable
            columns={columns}
            data={settings}
            isLoading={isLoading}
            pageCount={1}
            pageIndex={1}
            onPageChange={() => { }}
            emptyMessage="Belum ada setting SPP"
            emptySubMessage="Tambahkan setting nominal SPP menggunakan form di sebelah kiri"
          />
        </div>

      </div>
    </PageShell>
  )
}
