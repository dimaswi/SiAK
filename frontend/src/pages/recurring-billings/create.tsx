import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

export default function CreateRecurringBilling() {
  const navigate = useNavigate()
  const dialog = useAppDialog()

  const [classes, setClasses] = useState<{ id: string; name: string; level: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    type: "SPP",
    title: "",
    description: "",
    amount: "",
    target_type: "all",
    class_id: "",
    due_date_day: 1,
  })

  useEffect(() => {
    axios.get(`${API}/classes?limit=100`)
      .then(res => setClasses(res.data.data || []))
      .catch(console.error)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.target_type === "class" && !form.class_id) {
      dialog.alert("Pilih kelas terlebih dahulu!")
      return
    }

    setIsSubmitting(true)
    try {
      await axios.post(`${API}/recurring-billings`, {
        ...form,
        amount: Number(form.amount),
        due_date_day: Number(form.due_date_day)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      await dialog.alert("Aturan tagihan rutin berhasil dibuat!")
      navigate("/recurring-billings")
    } catch (err: any) {
      console.error(err)
      dialog.alert(err.response?.data?.message || "Terjadi kesalahan saat membuat aturan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/recurring-billings"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Aturan Tagihan Rutin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Sistem akan men-generate tagihan secara otomatis setiap bulannya berdasarkan aturan ini.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1 pb-24">
        <form id="recurring-form" onSubmit={handleSubmit} className="max-w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
          <div className="space-y-4">
            
            <div className="grid gap-2">
              <Label>Target Siswa *</Label>
              <Select value={form.target_type} onValueChange={(val) => handleSelectChange("target_type", val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Siswa</SelectItem>
                  <SelectItem value="class">Berdasarkan Kelas</SelectItem>
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

            <div className="grid gap-2">
              <Label>Jenis Tagihan *</Label>
              <Select value={form.type} onValueChange={(val) => handleSelectChange("type", val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPP">SPP Bulanan</SelectItem>
                  <SelectItem value="LAINNYA">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Judul Tagihan *</Label>
              <Input type="text" id="title" name="title" value={form.title} onChange={handleChange} placeholder="Contoh: SPP Bulanan" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Nominal per Bulan (Rp) *</Label>
                <Input type="number" id="amount" name="amount" value={form.amount} onChange={handleChange} placeholder="Misal: 500000" min="0" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date_day">Jatuh Tempo Tiap Tanggal *</Label>
                <Input type="number" id="due_date_day" name="due_date_day" value={form.due_date_day} onChange={handleChange} min="1" max="28" required />
                <p className="text-[10px] text-muted-foreground">Sistem akan membuat tagihan pada tanggal ini setiap bulan.</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Catatan untuk dilihat siswa..."
              />
            </div>

          </div>
        </form>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
        <Button type="submit" form="recurring-form" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Buat Aturan
        </Button>
      </div>
    </div>
  )
}

