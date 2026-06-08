import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, CheckCircle2, Clock, XCircle, User } from "lucide-react"

import PageShell from "../../components/PageShell"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useAppDialog } from "../../context/AppDialogContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import type { Billing } from "./columns"

const API = "http://localhost:8080/api"
const API_BASE = API.replace(/\/api$/, "")

interface PaymentTransaction {
  id: string
  billing_id: string
  amount: number
  payment_date: string
  payment_method: string
  bank_name: string
  account_holder: string
  payment_proof_url: string
  status: string
  notes: string
  verified_by: string
  verified_at: string
  created_at: string
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lunas: { label: "Lunas", icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, variant: "default" },
  sebagian: { label: "Dicicil (Sebagian)", icon: <Clock className="h-4 w-4 text-yellow-600" />, variant: "secondary" },
  belum_bayar: { label: "Belum Bayar", icon: <XCircle className="h-4 w-4 text-red-600" />, variant: "destructive" },
  dibatalkan: { label: "Dibatalkan", icon: <XCircle className="h-4 w-4 text-slate-600" />, variant: "outline" },
}

const txStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  terverifikasi: { label: "Terverifikasi", variant: "default" },
  pending: { label: "Menunggu Verifikasi", variant: "secondary" },
  ditolak: { label: "Ditolak", variant: "destructive" },
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export default function BillingShow() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdminOrTeacher = user?.role === "admin" || user?.role === "kepala_sekolah" || user?.role === "guru"
  const isStudent = user?.role === "siswa" || user?.role === "wali_murid"

  const [billing, setBilling] = useState<Billing | null>(null)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isVerifying, setIsVerifying] = useState<string | null>(null) // ID of tx being verified
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isProofPreviewOpen, setIsProofPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Transfer Bank",
    bank_name: "",
    account_holder: "",
    notes: "",
  })
  const [isSavingTx, setIsSavingTx] = useState(false)

  const fetchData = async () => {
    try {
      const bRes = await axios.get(`${API}/billings${isStudent ? "/student" : ""}/${id}`)
      setBilling(bRes.data)
      const tRes = await axios.get(`${API}/transactions${isStudent ? "/student" : ""}?billing_id=${id}`)
      setTransactions(tRes.data.data || [])
    } catch { navigate("/payments") }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billing) return
    const amt = Number(transactionForm.amount)
    if (amt <= 0) {
      dialog.alert("Nominal pembayaran harus lebih dari 0")
      return
    }
    if (amt > billing.total_amount - billing.paid_amount) {
      const confirmed = await dialog.confirm("Nominal pembayaran melebihi sisa tagihan. Yakin ingin melanjutkan?")
      if (!confirmed) return
    }

    setIsSavingTx(true)
    try {
      const res = await axios.post(`${API}/transactions${isStudent ? "/student" : ""}`, {
        ...transactionForm,
        billing_id: billing.id,
        amount: amt
      })

      if (proofFile) {
        const txId = res.data.id
        const fd = new FormData(); fd.append("proof", proofFile)
        await axios.post(`${API}/upload/payment-proof?transaction_id=${txId}`, fd)
      }

      await dialog.alert("Transaksi pembayaran berhasil direkam!")
      setProofFile(null)
      setTransactionForm({ ...transactionForm, amount: "", bank_name: "", account_holder: "", notes: "" })
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal menyimpan transaksi")
    } finally {
      setIsSavingTx(false)
    }
  }

  const handleVerify = async (txId: string, status: string) => {
    const notes = await dialog.prompt({ message: `Tambahkan catatan (opsional) untuk status ${status}:` })
    if (notes === null) return // cancelled

    setIsVerifying(txId)
    try {
      await axios.put(`${API}/transactions/${txId}/verify`, { status, notes })
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal memverifikasi transaksi")
    } finally { setIsVerifying(null) }
  }

  const handleDeleteTx = async (txId: string) => {
    const confirmed = await dialog.confirm("Yakin ingin menghapus transaksi ini? Status pembayaran akan disesuaikan otomatis.")
    if (!confirmed) return

    try {
      await axios.delete(`${API}/transactions/${txId}`)
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal menghapus transaksi")
    }
  }

  const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

  const handlePayOff = async () => {
    const confirmed = await dialog.confirm("Yakin ingin melunaskan sisa tagihan ini secara otomatis?")
    if (!confirmed) return

    try {
      await axios.put(`${API}/billings/${id}/pay-off`)
      await dialog.alert("Tagihan berhasil dilunaskan")
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal melunaskan tagihan")
    }
  }

  const handleDiscount = async () => {
    const amountStr = await dialog.prompt({ message: "Masukkan nominal potongan/diskon (Rp):" })
    if (!amountStr) return

    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) {
      await dialog.alert("Nominal tidak valid")
      return
    }

    const confirmed = await dialog.confirm(`Berikan potongan sebesar ${formatRp(amount)}? Total tagihan akan berkurang.`)
    if (!confirmed) return

    try {
      await axios.put(`${API}/billings/${id}/discount`, { discount: amount })
      await dialog.alert("Potongan berhasil diberikan")
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal memberikan potongan")
    }
  }
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!billing) return null

  const sc = statusConfig[billing.status] || { label: billing.status, icon: null, variant: "outline" as const }
  const sisa = billing.total_amount - billing.paid_amount

  return (
    <PageShell
      title="Detail Tagihan"
      description={`${billing.title} — ${billing.student_name}`}
      backButton={
        <Button variant="outline" size="icon" className="rounded-full shrink-0" asChild>
          <Link to="/payments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
      }
      actions={
        isAdminOrTeacher && billing.status !== "lunas" && billing.status !== "dibatalkan" ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscount}>Beri Potongan</Button>
            <Button variant="default" size="sm" onClick={handlePayOff}>Lunasi Tagihan</Button>
          </div>
        ) : undefined
      }
    >
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x">

          {/* Left: Info Tagihan & Riwayat */}
          <div className="lg:col-span-2 p-6 flex flex-col gap-8">

            {/* Header & Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground leading-tight">{billing.student_name}</h3>
                  <p className="text-sm text-muted-foreground font-mono mt-1">NIS: {billing.student_nis}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sc.variant} className="text-sm px-3 py-1">{sc.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{billing.type.replace("_", " ")}</p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Rincian Tagihan */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Rincian Tagihan</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <InfoRow label="Judul" value={billing.title} />
                <InfoRow label="Jatuh Tempo" value={formatDate(billing.due_date)} />
                <InfoRow label="Total Tagihan" value={formatRp(billing.total_amount)} />
                <InfoRow label="Terbayar" value={formatRp(billing.paid_amount)} />
              </div>
              <div className="mt-6 p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                <span className="font-medium text-foreground">Sisa Tagihan yang Harus Dibayar:</span>
                <span className={`text-xl font-bold ${sisa > 0 ? "text-red-600" : "text-foreground"}`}>{formatRp(sisa)}</span>
              </div>
            </div>

            <hr className="border-border" />

            {/* Riwayat Pembayaran / Cicilan */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Riwayat Pembayaran / Cicilan</h4>
              {transactions.length === 0 ? (
                <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground text-sm">Belum ada transaksi pembayaran.</div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(tx => {
                    const tsc = txStatusConfig[tx.status] || { label: tx.status, variant: "outline" as const }
                    return (
                      <div key={tx.id} className="p-4 border rounded-lg flex flex-col md:flex-row gap-4 justify-between hover:bg-muted/20 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground text-base">{formatRp(tx.amount)}</span>
                            <Badge variant={tsc.variant} className="text-[10px] h-5 py-0">{tsc.label}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(tx.payment_date)} • {tx.payment_method} {tx.bank_name ? `(${tx.bank_name})` : ""}
                          </div>
                          {tx.notes && <p className="text-sm text-foreground italic border-l-2 border-primary/30 pl-2 mt-1">"{tx.notes}"</p>}
                          {tx.payment_proof_url && (
                            <button onClick={() => { setPreviewUrl(tx.payment_proof_url); setIsProofPreviewOpen(true); }} className="text-sm font-medium text-primary hover:underline mt-1 inline-block">
                              Lihat Bukti Transfer
                            </button>
                          )}
                        </div>
                        {isAdminOrTeacher && (
                          <div className="flex flex-col gap-2 shrink-0 md:w-32">
                            {tx.status === "pending" ? (
                              <>
                                <Button size="sm" variant="default" className="w-full bg-green-600 hover:bg-green-700 h-8" onClick={() => handleVerify(tx.id, "terverifikasi")} disabled={isVerifying === tx.id}>Terima</Button>
                                <Button size="sm" variant="destructive" className="w-full h-8" onClick={() => handleVerify(tx.id, "ditolak")} disabled={isVerifying === tx.id}>Tolak</Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" className="h-8 text-xs w-full" onClick={() => handleVerify(tx.id, "pending")} disabled={isVerifying === tx.id}>Batal Verifikasi</Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 w-full" onClick={() => handleDeleteTx(tx.id)}>Hapus</Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right: Bayar / Cicil Baru */}
          <div className="p-6 bg-muted/10 flex flex-col gap-6">
            {billing.status !== "lunas" && billing.status !== "dibatalkan" ? (
              <div className="space-y-6 sticky top-6">
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    {isAdminOrTeacher ? "Rekam Pembayaran Baru" : "Lapor Pembayaran Baru"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAdminOrTeacher ? "Catat cicilan atau pelunasan tagihan ini secara manual." : "Unggah bukti transfer untuk diverifikasi admin."}
                  </p>
                </div>

                <form onSubmit={handleSaveTransaction} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nominal Dibayar (Rp) *</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder={`Sisa: ${sisa}`}
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tanggal Bayar *</Label>
                    <Input
                      type="date"
                      value={transactionForm.payment_date}
                      onChange={(e) => setTransactionForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Metode Pembayaran</Label>
                    <Select value={transactionForm.payment_method} onValueChange={(val) => setTransactionForm(p => ({ ...p, payment_method: val }))}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                        <SelectItem value="Tunai">Tunai</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {transactionForm.payment_method === "Transfer Bank" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Bank Asal</Label>
                        <Input placeholder="BCA" value={transactionForm.bank_name} onChange={(e) => setTransactionForm((prev) => ({ ...prev, bank_name: e.target.value }))} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Atas Nama</Label>
                        <Input placeholder="Nama pengirim" value={transactionForm.account_holder} onChange={(e) => setTransactionForm((prev) => ({ ...prev, account_holder: e.target.value }))} className="bg-white" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Catatan Tambahan</Label>
                    <Input placeholder="Opsional..." value={transactionForm.notes} onChange={(e) => setTransactionForm((prev) => ({ ...prev, notes: e.target.value }))} className="bg-white" />
                  </div>
                  <div className="pt-2">
                    <Label className="text-sm font-medium mb-2 block">Upload Bukti {transactionForm.payment_method === "Transfer Bank" ? "Transfer" : "Bayar"}</Label>
                    <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} className="w-full bg-white file:bg-muted file:text-muted-foreground file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2" />
                  </div>

                  <Button type="submit" disabled={isSavingTx} className="w-full mt-4 h-10">
                    {isSavingTx ? "Menyimpan..." : "Simpan Pembayaran"}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-xl border border-dashed">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                <h4 className="font-semibold text-foreground">Tagihan Sudah Selesai</h4>
                <p className="text-sm text-muted-foreground mt-1">Tidak ada tindakan lebih lanjut yang diperlukan.</p>
              </div>
            )}

            {/* Link to student (Only Admin/Teacher) */}
            {isAdminOrTeacher && (
              <div className="mt-auto pt-8">
                <Button variant="outline" className="w-full justify-center bg-white" asChild>
                  <Link to={`/students/${billing.student_id}`}>Lihat Profil Siswa</Link>
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      <Dialog open={isProofPreviewOpen} onOpenChange={setIsProofPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Bukti Transaksi</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <img
              src={`${API_BASE}${previewUrl}`}
              alt="Preview bukti transfer"
              className="max-h-[75vh] w-full rounded-md object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
