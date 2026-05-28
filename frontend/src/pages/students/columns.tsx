import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Eye, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"

export type Student = {
  id: string
  nis: string
  nisn: string
  full_name: string
  gender: string
  is_active: boolean
}

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "nis",
    header: "NIS",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("nis")}
      </span>
    ),
  },
  {
    accessorKey: "nisn",
    header: "NISN",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("nisn") || "—"}
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
      const student = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Link to={`/siswa/${student.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Lihat Detail</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Link to={`/siswa/${student.id}/edit`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Data</span>
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
