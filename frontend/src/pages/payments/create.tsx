import { useState, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Save, CheckSquare, Square, Search, Loader2 } from "lucide-react"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useAppDialog } from "../../context/AppDialogContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"

const API = "http://localhost:8080/api"

export default function BillingCreate() {
  const navigate = useNavigate()
  const dialog = useAppDialog()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [students, setStudents] = useState<{ id: string; full_name: string; nis: string }[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string; level: string }[]>([])

  const [form, setForm] = useState({
    target_type: "manual", // 'manual', 'class', 'all'
    class_id: "",
    type: "SPP",
    title: "",
    description: "",
    total_amount: "",
    due_date: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    is_installment: false,
    installment_count: 1,
    is_recurring: false,
    due_date_day: 1,
  })

  // Student selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")

  useEffect(() => {
    axios.get(`${API}/students?limit=1000`)
      .then(res => setStudents(res.data.data || []))
      .catch(console.error)

    axios.get(`${API}/classes?limit=100`)
      .then(res => setClasses(res.data.data || []))
      .catch(console.error)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [name]: value }
      if (name === "type" && value === "SPP") {
        updated.title = `SPP Bulan ${updated.month}/${updated.year}`
      }
      return updated
    })
  }

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [students, studentSearch])

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      // deselect all filtered
      setSelectedStudentIds([])
    } else {
      // select all filtered
      setSelectedStudentIds(filteredStudents.map(s => s.id))
    }
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let finalStudentIds = selectedStudentIds

    if (form.target_type === "all") {
      finalStudentIds = students.map(s => s.id)
    } else if (form.target_type === "class") {
      if (!form.class_id) {
        await dialog.alert("Pilih kelas terlebih dahulu.")
        return
      }
      try {
        const res = await axios.get(`${API}/classes/${form.class_id}/students`)
        finalStudentIds = (res.data.data || []).map((s: any) => s.id)
      } catch (err) {
        await dialog.alert("Gagal mengambil data siswa di kelas ini.")
        return
      }
    }

    const needsStudentValidation = !form.is_recurring || form.target_type === "manual"
    if (needsStudentValidation && finalStudentIds.length === 0) {
      await dialog.alert("Tidak ada siswa yang dipilih/ditemukan untuk ditagih.")
      return
    }

    setIsSubmitting(true)
    try {
      if (form.is_recurring) {
        await axios.post(`${API}/recurring-billings`, {
          type: form.type,
          title: form.title,
          description: form.description,
          amount: Number(form.total_amount),
          target_type: form.target_type,
          class_id: form.class_id || null,
          student_ids: form.target_type === "manual" ? finalStudentIds : undefined,
          due_date_day: Number(form.due_date_day),
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        await dialog.alert("Aturan tagihan rutin berhasil dibuat!")
      } else {
        await axios.post(`${API}/billings`, {
          ...form,
          student_ids: finalStudentIds,
          total_amount: Number(form.total_amount),
          month: form.type === "SPP" ? Number(form.month) : null,
          year: form.type === "SPP" ? Number(form.year) : null,
          installment_count: Number(form.installment_count),
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        await dialog.alert("Tagihan berhasil dibuat!")
      }
      navigate("/payments")
    } catch (err: any) {
      dialog.alert(err.response?.data?.message || "Gagal membuat tagihan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/payments"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Tagihan Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buat tagihan manual untuk satu atau banyak siswa (SPP, Uang Gedung, Seragam, dll).</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1 pb-24">
        <form id="payment-form" onSubmit={handleSubmit} className="max-w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
          <div className="space-y-4">

            <div className="grid gap-2">
              <Label>Target Tagihan *</Label>
              <Select value={form.target_type} onValueChange={(val) => handleSelectChange("target_type", val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Pilih Siswa Manual</SelectItem>
                  <SelectItem value="class">Berdasarkan Kelas</SelectItem>
                  <SelectItem value="all">Semua Siswa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.target_type === "class" && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                <Label>Pilih Kelas *</Label>
                <Select value={form.class_id} onValueChange={(val) => handleSelectChange("class_id", val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.level} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.target_type === "manual" && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                <Label>Siswa yang Ditagih *</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsStudentModalOpen(true)}
                    className="w-full justify-start text-left font-normal"
                  >
                    {selectedStudentIds.length === 0
                      ? "Pilih Siswa..."
                      : `${selectedStudentIds.length} Siswa Dipilih (Klik untuk ubah)`}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-slate-100">
              <div className="grid gap-2">
                <Label htmlFor="type">Jenis Tagihan *</Label>
                <Select value={form.type} onValueChange={(val) => handleSelectChange("type", val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPP">SPP Bulanan</SelectItem>
                    <SelectItem value="UANG_GEDUNG">Uang Gedung</SelectItem>
                    <SelectItem value="SERAGAM">Seragam</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!form.is_recurring ? (
                <div className="grid gap-2">
                  <Label htmlFor="due_date">{form.is_installment ? "Jatuh Tempo Cicilan Pertama *" : "Jatuh Tempo *"}</Label>
                  <Input type="date" id="due_date" name="due_date" value={form.due_date} onChange={handleChange} required />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="due_date_day">Jatuh Tempo Tiap Tanggal *</Label>
                  <Input type="number" id="due_date_day" name="due_date_day" value={form.due_date_day} onChange={handleChange} min="1" max="28" required />
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  name="is_recurring"
                  checked={form.is_recurring}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, is_recurring: e.target.checked, is_installment: false }))
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_recurring" className="cursor-pointer">Jadikan Tagihan Rutin (Otomatis Tiap Bulan)</Label>
              </div>
              {form.is_recurring && (
                <p className="text-xs text-slate-500">
                  Sistem akan membuat tagihan secara otomatis pada tanggal yang ditentukan setiap bulan. Fitur cicilan tidak dapat digunakan pada tagihan rutin.
                </p>
              )}
            </div>

            {form.type === "SPP" && !form.is_recurring && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Bulan SPP</Label>
                  <Select value={form.month} onValueChange={(val) => handleSelectChange("month", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tahun SPP</Label>
                  <Input type="number" name="year" value={form.year} onChange={handleChange} />
                </div>
              </div>
            )}

            {form.type !== "SPP" && !form.is_recurring && (
              <div className="bg-slate-50 p-4 rounded-lg border flex flex-col gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_installment"
                    name="is_installment"
                    checked={form.is_installment}
                    onChange={(e) => setForm(prev => ({ ...prev, is_installment: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_installment" className="cursor-pointer">Izinkan Pembayaran Dicicil Berulang</Label>
                </div>

                {form.is_installment && (
                  <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="installment_count">Dibagi Berapa Kali Cicilan? *</Label>
                    <Input id="installment_count" name="installment_count" type="number" min="2" max="24" value={form.installment_count} onChange={handleChange} required />
                    <p className="text-xs text-slate-500">
                      Sistem akan membuat {form.installment_count} tagihan untuk murid sebesar Rp {(Number(form.total_amount) / Number(form.installment_count || 1)).toLocaleString("id-ID")} dengan jeda masing-masing 1 bulan dari cicilan pertama.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">Judul Tagihan *</Label>
              <Input type="text" id="title" name="title" value={form.title} onChange={handleChange} placeholder="Contoh: Uang Gedung 2025" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="total_amount">{form.is_recurring ? "Nominal per Bulan (Rp) *" : "Total Nominal Keseluruhan (Rp) *"}</Label>
              <Input type="number" id="total_amount" name="total_amount" value={form.total_amount} onChange={handleChange} placeholder="500000" min="0" required />
              <p className="text-xs text-muted-foreground">{form.is_recurring ? "Nominal yang akan ditagihkan secara berulang setiap bulan." : "Nominal ditentukan secara manual sesuai kesepakatan/kebijakan."}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Keterangan Tambahan</Label>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Opsional..." />
            </div>
          </div>
        </form>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
        <Button type="submit" form="payment-form" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Buat Tagihan
        </Button>
      </div>

      <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Siswa</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-hidden py-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama atau NIS..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleSelectAll} className="shrink-0 gap-2">
                {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                  <><CheckSquare className="h-4 w-4" /> Deselect All</>
                ) : (
                  <><CheckSquare className="h-4 w-4" /> Select All</>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              <div className="divide-y">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">Siswa tidak ditemukan.</div>
                ) : (
                  filteredStudents.map(s => {
                    const isSelected = selectedStudentIds.includes(s.id)
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleStudent(s.id)}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm text-slate-900">{s.full_name}</p>
                          <p className="text-xs text-slate-500">{s.nis}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="text-sm text-slate-500">
              {selectedStudentIds.length} siswa dipilih
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsStudentModalOpen(false)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
