import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, ListTodo } from "lucide-react"

import { Button } from "../../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

export type PPDBApp = {
  id: string
  registration_no: string
  full_name: string
  previous_school: string
  parent_phone: string
  status: string
  converted_student_id?: string
}

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    baru: "bg-blue-100 text-blue-800",
    verifikasi_berkas: "bg-yellow-100 text-yellow-800",
    lulus: "bg-emerald-100 text-emerald-800",
    cadangan: "bg-orange-100 text-orange-800",
    ditolak: "bg-red-100 text-red-800",
    daftar_ulang: "bg-purple-100 text-purple-800"
  }
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}>{status.replace("_", " ").toUpperCase()}</span>
}

export const columns: ColumnDef<PPDBApp>[] = [
  {
    accessorKey: "registration_no",
    header: "No. Pendaftaran",
    cell: ({ row }) => {
      const isStudent = row.original.converted_student_id
      return (
        <div>
          <div className="font-medium text-slate-900">{row.original.registration_no}</div>
          {isStudent && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded uppercase font-bold mt-1 inline-block">Siswa Aktif</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "full_name",
    header: "Nama Lengkap",
    cell: ({ row }) => <span className="font-medium">{row.original.full_name}</span>
  },
  {
    accessorKey: "previous_school",
    header: "Asal Sekolah",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.previous_school || "-"}</span>
  },
  {
    accessorKey: "parent_phone",
    header: "Kontak Ortu",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.parent_phone || "-"}</span>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const app = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu aksi</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi PPDB</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/ppdb/${app.id}`} className="cursor-pointer flex items-center">
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Detail & Tindak Lanjut</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/ppdb/${app.id}/edit`} className="cursor-pointer flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Pendaftar</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
