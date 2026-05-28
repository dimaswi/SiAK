import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, CheckCircle2, Clock, XCircle, Upload, User } from "lucide-react"

import PageShell from "../../components/PageShell"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useAppDialog } from "../../context/AppDialogContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"

const API = "http://localhost:8080/api"
const API_BASE = API.replace(/\/api$/, "")

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lunas: { label: "Lunas", icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, variant: "default" },
  pending_verifikasi: { label: "Menunggu Verifikasi", icon: <Clock className="h-4 w-4 text-yellow-600" />, variant: "secondary" },
  belum_bayar: { label: "Belum Bayar", icon: <XCircle className="h-4 w-4 text-red-600" />, variant: "destructive" },
  bebas_spp: { label: "Bebas SPP", icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />, variant: "outline" },
}

interface SppPayment {
  id: string; student_id: string; student_name: string; student_nis: string; class_name: string;
  academic_year: string; month: number; year: number;
  amount: number; late_fee: number; discount: number; total_amount: number;
  due_date: string; status: string;
  payment_date: string; bank_name: string; account_holder: string;
  transaction_id: string; payment_proof_url: string;
  verified_at: string; paid_at: string; notes: string;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export default function SppShow() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdminOrTeacher = user?.role === "admin" || user?.role === "kepala_sekolah" || user?.role === "guru"
  const isStudent = user?.role === "siswa" || user?.role === "wali_murid"

  const [payment, setPayment] = useState<SppPayment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState("lunas")
  const [verifyNotes, setVerifyNotes] = useState("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [isProofPreviewOpen, setIsProofPreviewOpen] = useState(false)
  const [studentPaymentForm, setStudentPaymentForm] = useState({
    payment_date: "",
    bank_name: "",
    account_holder: "",
    transaction_id: "",
    notes: "",
  })
  const [isSavingStudentDetail, setIsSavingStudentDetail] = useState(false)
  const [adminAdjustForm, setAdminAdjustForm] = useState({
    due_date: "",
    late_fee: "",
    discount: "",
    notes: "",
  })
  const [isSavingAdminAdjust, setIsSavingAdminAdjust] = useState(false)

  const fetchPayment = async () => {
    try {
      const res = await axios.get(`${API}/spp/payments/${id}`)
      setPayment(res.data)
    } catch { navigate("/spp") }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchPayment() }, [id])

  useEffect(() => {
    if (!payment) return
    setStudentPaymentForm({
      payment_date: payment.payment_date ? payment.payment_date.split("T")[0] : "",
      bank_name: payment.bank_name || "",
      account_holder: payment.account_holder || "",
      transaction_id: payment.transaction_id || "",
      notes: payment.notes || "",
    })
  }, [payment])

  useEffect(() => {
    if (!payment) return
    setAdminAdjustForm({
      due_date: payment.due_date ? payment.due_date.split("T")[0] : "",
      late_fee: payment.late_fee > 0 ? String(payment.late_fee) : "",
      discount: payment.discount > 0 ? String(payment.discount) : "",
      notes: payment.notes || "",
    })
  }, [payment])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    try {
      await axios.put(`${API}/spp/payments/${id}/verify`, { status: verifyStatus, notes: verifyNotes })
      fetchPayment()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal memverifikasi pembayaran")
    } finally { setIsVerifying(false) }
  }

  const handleUploadProof = async () => {
    if (!proofFile) return
    setUploadingProof(true)
    try {
      const fd = new FormData(); fd.append("proof", proofFile)
      await axios.post(`${API}/upload/payment-proof?payment_id=${id}`, fd)
      fetchPayment()
      setProofFile(null)
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal upload bukti")
    } finally { setUploadingProof(false) }
  }

  const handleSaveStudentPaymentDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingStudentDetail(true)
    try {
      await axios.put(`${API}/spp/payments/${id}`, studentPaymentForm)
      await dialog.alert("Rincian pembayaran berhasil disimpan")
      fetchPayment()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal menyimpan rincian pembayaran")
    } finally {
      setIsSavingStudentDetail(false)
    }
  }

  const handleSaveAdminAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingAdminAdjust(true)
    try {
      await axios.put(`${API}/spp/payments/${id}`, {
        due_date: adminAdjustForm.due_date || "",
        late_fee: adminAdjustForm.late_fee === "" ? null : Number(adminAdjustForm.late_fee),
        discount: adminAdjustForm.discount === "" ? null : Number(adminAdjustForm.discount),
        notes: adminAdjustForm.notes,
      })
      await dialog.alert("Penyesuaian tagihan berhasil disimpan")
      fetchPayment()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal menyimpan penyesuaian tagihan")
    } finally {
      setIsSavingAdminAdjust(false)
    }
  }

  const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!payment) return null

  const sc = statusConfig[payment.status] || { label: payment.status, icon: null, variant: "outline" as const }

  return (
    <PageShell
      title="Detail Tagihan SPP"
      description={`${MONTHS[payment.month - 1]} ${payment.year} — ${payment.student_name}`}
      backButton={
        <Button variant="outline" size="icon" className="rounded-none shrink-0" asChild>
          <Link to="/spp"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Info Tagihan */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Status Header */}
          <Card className="border bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{payment.student_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">NIS: {payment.student_nis}</p>
                  <p className="text-xs text-muted-foreground">{payment.class_name || "Tanpa Kelas"}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={sc.variant} className="mb-1">{sc.label}</Badge>
                <p className="text-xs text-muted-foreground">Tahun Ajaran {payment.academic_year}</p>
              </div>
            </CardContent>
          </Card>

          {/* Rincian Tagihan */}
          <Card className="border bg-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Rincian Tagihan</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoRow label="Periode" value={`${MONTHS[payment.month - 1]} ${payment.year}`} />
              <InfoRow label="Jatuh Tempo" value={formatDate(payment.due_date)} />
              <InfoRow label="Nominal SPP" value={formatRp(payment.amount)} />
              <InfoRow label="Denda Keterlambatan" value={payment.late_fee > 0 ? formatRp(payment.late_fee) : "—"} />
              <InfoRow label="Potongan / Diskon" value={payment.discount > 0 ? formatRp(payment.discount) : "—"} />
              <div>
                <p className="text-xs text-muted-foreground">Total Tagihan</p>
                <p className="text-lg font-bold text-foreground">{formatRp(payment.total_amount)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Pembayaran */}
          {(payment.payment_date || payment.transaction_id || payment.payment_proof_url) && (
            <Card className="border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Informasi Pembayaran</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <InfoRow label="Tanggal Bayar" value={formatDate(payment.payment_date)} />
                <InfoRow label="Bank" value={payment.bank_name} />
                <InfoRow label="Atas Nama" value={payment.account_holder} />
                <InfoRow label="No. Transaksi" value={payment.transaction_id} />
                {payment.payment_proof_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Bukti Transfer</p>
                    <a href={`${API_BASE}${payment.payment_proof_url}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary underline hover:no-underline">
                      Lihat Bukti Transfer ↗
                    </a>
                    {/\.(jpg|jpeg|png|webp)$/i.test(payment.payment_proof_url) ? (
                      <button
                        type="button"
                        className="mt-3 block"
                        onClick={() => setIsProofPreviewOpen(true)}
                      >
                        <img
                          src={`${API_BASE}${payment.payment_proof_url}`}
                          alt="Bukti transfer"
                          className="max-h-72 w-auto rounded-md border object-contain"
                        />
                      </button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Input Rincian & Upload Bukti (Only for Student) */}
          {isStudent && (payment.status === "belum_bayar" || payment.status === "pending_verifikasi") ? (
            <Card className="border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Rincian Pembayaran</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <form onSubmit={handleSaveStudentPaymentDetail} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal Bayar</Label>
                    <Input
                      type="date"
                      value={studentPaymentForm.payment_date}
                      onChange={(e) => setStudentPaymentForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bank</Label>
                    <Input
                      placeholder="Contoh: BCA"
                      value={studentPaymentForm.bank_name}
                      onChange={(e) => setStudentPaymentForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Atas Nama</Label>
                    <Input
                      placeholder="Nama pemilik rekening"
                      value={studentPaymentForm.account_holder}
                      onChange={(e) => setStudentPaymentForm((prev) => ({ ...prev, account_holder: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">No. Transaksi</Label>
                    <Input
                      placeholder="Nomor referensi transaksi"
                      value={studentPaymentForm.transaction_id}
                      onChange={(e) => setStudentPaymentForm((prev) => ({ ...prev, transaction_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Catatan</Label>
                    <Input
                      placeholder="Catatan tambahan (opsional)"
                      value={studentPaymentForm.notes}
                      onChange={(e) => setStudentPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" disabled={isSavingStudentDetail} size="sm" className="w-full">
                    {isSavingStudentDetail ? "Menyimpan..." : "Simpan Rincian Pembayaran"}
                  </Button>
                </form>

                <div className="pt-2 border-t">
                  <Label className="text-xs mb-2 block">Upload Bukti Transfer</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} className="flex-1" />
                    <Button onClick={handleUploadProof} disabled={!proofFile || uploadingProof} size="sm" className="gap-2 shrink-0">
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right: Verifikasi Admin */}
        <div className="flex flex-col gap-4">
          {/* Status History */}
          {payment.verified_at && (
            <Card className="border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Riwayat Verifikasi</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Diverifikasi" value={formatDate(payment.verified_at)} />
                {payment.paid_at && <InfoRow label="Dilunaskan" value={formatDate(payment.paid_at)} />}
                {payment.notes && <InfoRow label="Catatan" value={payment.notes} />}
              </CardContent>
            </Card>
          )}

          {/* Form Verifikasi (Only Admin/Teacher) */}
          {isAdminOrTeacher && payment.status !== "lunas" && payment.status !== "bebas_spp" && (
            <Card className="border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Verifikasi / Terima Tunai</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Update Status</Label>
                    <Select value={verifyStatus} onValueChange={setVerifyStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lunas">✅ Lunas (Terima Tunai/Transfer)</SelectItem>
                        <SelectItem value="bebas_spp">🆓 Bebas SPP</SelectItem>
                        <SelectItem value="belum_bayar">❌ Kembalikan ke Belum Bayar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Catatan Admin</Label>
                    <Input placeholder="Catatan tambahan (opsional)" value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={isVerifying} size="sm" className="w-full">
                    {isVerifying ? "Menyimpan..." : "Simpan Status Pembayaran"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {isAdminOrTeacher && (
            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Penyesuaian Tagihan Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAdminAdjust} className="flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jatuh Tempo (Manual)</Label>
                    <Input
                      type="date"
                      value={adminAdjustForm.due_date}
                      onChange={(e) => setAdminAdjustForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Denda Keterlambatan (Opsional)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Kosongkan jika tidak ada denda"
                      value={adminAdjustForm.late_fee}
                      onChange={(e) => setAdminAdjustForm((prev) => ({ ...prev, late_fee: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Potongan / Diskon (Opsional)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Kosongkan jika tidak ada diskon"
                      value={adminAdjustForm.discount}
                      onChange={(e) => setAdminAdjustForm((prev) => ({ ...prev, discount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Catatan</Label>
                    <Input
                      placeholder="Contoh: Diskon khusus siswa berprestasi"
                      value={adminAdjustForm.notes}
                      onChange={(e) => setAdminAdjustForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={isSavingAdminAdjust}>
                    {isSavingAdminAdjust ? "Menyimpan..." : "Simpan Penyesuaian"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Link to student (Only Admin/Teacher) */}
          {isAdminOrTeacher && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/siswa/${payment.student_id}`}>← Lihat Profil Siswa</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/spp?student_id=${payment.student_id}`}>Riwayat SPP Siswa Ini</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={isProofPreviewOpen} onOpenChange={setIsProofPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Bukti Transfer</DialogTitle>
          </DialogHeader>
          {payment?.payment_proof_url ? (
            <img
              src={`${API_BASE}${payment.payment_proof_url}`}
              alt="Preview bukti transfer"
              className="max-h-[75vh] w-full rounded-md object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
