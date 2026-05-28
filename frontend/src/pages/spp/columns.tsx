import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { Eye, Trash2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"

export type SppPayment = {
  id: string
  student_name: string
  student_nis: string
  class_name: string
  academic_year: string
  month: number
  year: number
  amount: number
  total_amount: number
  late_fee: number
  discount: number
  due_date: string
  status: string
}

export type SppSetting = {
  id: string
  academic_year: string
  grade_level: number | null
  class_id?: string | null
  class_name?: string | null
  amount: number
  description: string
  is_active: boolean
  created_at: string
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
]

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lunas: { label: "Lunas", variant: "default" },
  pending_verifikasi: { label: "Menunggu Verifikasi", variant: "secondary" },
  belum_bayar: { label: "Belum Bayar", variant: "destructive" },
  bebas_spp: { label: "Bebas SPP", variant: "outline" },
}

// ── SPP Payment Columns ───────────────────────────────────────
export const sppPaymentColumns: ColumnDef<SppPayment>[] = [
  {
    id: "siswa",
    header: "Siswa",
    cell: ({ row }) => {
      const p = row.original
      return (
        <div>
          <p className="font-medium text-sm text-foreground">{p.student_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{p.student_nis}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "class_name",
    header: "Kelas",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {(row.getValue("class_name") as string) || "—"}
      </span>
    ),
  },
  {
    id: "periode",
    header: "Periode",
    cell: ({ row }) => {
      const p = row.original
      return (
        <span className="text-sm">
          {MONTHS[p.month - 1]} {p.year}
        </span>
      )
    },
  },
  {
    accessorKey: "total_amount",
    header: "Nominal",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{formatRp(row.getValue("total_amount"))}</span>
    ),
  },
  {
    accessorKey: "due_date",
    header: "Jatuh Tempo",
    cell: ({ row }) => {
      const d = row.getValue("due_date") as string
      return (
        <span className="text-sm text-muted-foreground">
          {d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const sc = statusConfig[status] || { label: status, variant: "outline" as const }
      return <Badge variant={sc.variant}>{sc.label}</Badge>
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Link to={`/spp/${row.original.id}`}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Lihat Detail</span>
          </Link>
        </Button>
      </div>
    ),
  },
]

// ── SPP Setting Columns ───────────────────────────────────────
export function buildSppSettingColumns(
  onDelete: (id: string) => void
): ColumnDef<SppSetting>[] {
  return [
    {
      accessorKey: "academic_year",
      header: "Tahun Ajaran",
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.getValue("academic_year")}</span>
      ),
    },
    {
      id: "target",
      header: "Berlaku Untuk",
      cell: ({ row }) => {
        const gl = row.original.grade_level
        const cName = row.original.class_name
        
        if (cName) {
          return <span className="text-sm font-medium text-primary">Kelas Spesifik: {cName}</span>
        }
        if (gl) {
          return <span className="text-sm text-muted-foreground">Tingkat: Kelas {gl}</span>
        }
        return <span className="text-sm text-muted-foreground italic">Semua Kelas / Global</span>
      },
    },
    {
      accessorKey: "amount",
      header: "Nominal / Bulan",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">
          {formatRp(row.getValue("amount"))}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Keterangan",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {(row.getValue("description") as string) || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Hapus</span>
          </Button>
        </div>
      ),
    },
  ]
}
