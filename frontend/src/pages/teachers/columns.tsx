import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Eye, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"

export type Teacher = {
  id: string
  nip: string
  full_name: string
  gender: string
  subject: string
  phone: string
  is_active: boolean
}

export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "nip",
    header: "NIP",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("nip")}
      </span>
    ),
  },
  {
    accessorKey: "full_name",
    header: "Nama Lengkap",
    cell: ({ row }) => (
      <span className="font-medium text-foreground text-sm">
        {row.getValue("full_name")}
      </span>
    ),
  },
  {
    accessorKey: "gender",
    header: "Kelamin",
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string
      return (
        <span className="text-sm text-muted-foreground">
          {gender === "L" ? "Laki-laki" : "Perempuan"}
        </span>
      )
    },
  },
  {
    accessorKey: "subject",
    header: "Mata Pelajaran",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {(row.getValue("subject") as string) || "—"}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Telepon",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {(row.getValue("phone") as string) || "—"}
      </span>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? "default" : "secondary"} className="text-xs font-medium">
          {isActive ? "Aktif" : "Non-aktif"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => {
      const teacher = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Link to={`/guru/${teacher.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Lihat Detail</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Link to={`/guru/${teacher.id}/edit`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Ubah Data</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Hapus Data</span>
          </Button>
        </div>
      )
    },
  },
]
