import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { Eye } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"

export type Billing = {
  id: string
  student_id: string
  student_name: string
  student_nis: string
  type: string
  title: string
  description: string
  total_amount: number
  paid_amount: number
  due_date: string
  status: string
  has_pending?: boolean
  month?: number
  year?: number
}

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lunas: { label: "Lunas", variant: "default" },
  sebagian: { label: "Dicicil", variant: "secondary" },
  belum_bayar: { label: "Belum Bayar", variant: "destructive" },
  dibatalkan: { label: "Dibatalkan", variant: "outline" },
}

export const billingColumns: ColumnDef<Billing>[] = [
  {
    id: "siswa",
    header: "Siswa",
    cell: ({ row }) => {
      const b = row.original
      return (
        <div>
          <p className="font-medium text-sm text-foreground">{b.student_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{b.student_nis}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Jenis Tagihan",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {(row.getValue("type") as string).replace("_", " ")}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("title")}
      </span>
    ),
  },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{formatRp(row.getValue("total_amount"))}</span>
    ),
  },
  {
    accessorKey: "paid_amount",
    header: "Terbayar",
    cell: ({ row }) => {
      const paid = row.getValue("paid_amount") as number
      const total = row.original.total_amount
      return (
        <span className={`text-sm font-medium ${paid > 0 && paid < total ? "text-orange-600" : paid >= total ? "text-green-600" : "text-muted-foreground"}`}>
          {formatRp(paid)}
        </span>
      )
    },
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
      if (row.original.has_pending) {
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-sm">Perlu Verifikasi</Badge>
      }
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
          <Link to={`/payments/${row.original.id}`}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Lihat Detail</span>
          </Link>
        </Button>
      </div>
    ),
  },
]
