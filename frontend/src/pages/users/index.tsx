import { useState, useEffect } from "react"
import axios from "axios"
import { KeyRound, AlertCircle } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Switch } from "../../components/ui/switch"
import { DataTable } from "../../components/DataTable"
import { useAuth } from "../../context/AuthContext"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

interface UserItem {
  id: string
  identifier: string
  role: string
  is_active: boolean
  must_change_password: boolean
}

const roleMap: Record<string, string> = {
  admin: "Admin",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
  siswa: "Siswa",
  wali_murid: "Wali Murid",
}

const roleBadgeColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  kepala_sekolah: "default",
  guru: "secondary",
  siswa: "outline",
  wali_murid: "outline",
}

export default function UsersIndex() {
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdmin = user?.role === "admin"

  const [data, setData] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 15

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchData = async (currentPage = page) => {
    setIsLoading(true)
    try {
      const res = await axios.get(`${API}/users?page=${currentPage}&limit=${limit}&search=${search}`)
      setData(res.data.data || [])
      setTotalPages(res.data.meta?.total_pages || 1)
      setTotalItems(res.data.meta?.total_items || 0)
    } catch (err) {
      console.error("Gagal mengambil data pengguna:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData(page) }, [page])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return
    setUpdatingId(userId)
    try {
      await axios.put(`${API}/users/${userId}/role`, { role: newRole })
      // Update local state
      setData(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal mengubah role")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    if (!isAdmin) return
    setUpdatingId(userId)
    try {
      await axios.put(`${API}/users/${userId}/status`, { is_active: !currentStatus })
      setData(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal mengubah status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePasswordChange = async (userId: string) => {
    if (!isAdmin) return
    const newPassword = await dialog.prompt({
      title: "Ubah Password",
      message: "Masukkan password baru (minimal 6 karakter).",
      placeholder: "Password baru",
      password: true,
    })
    if (!newPassword) return
    if (newPassword.length < 6) {
      await dialog.alert("Password minimal 6 karakter")
      return
    }

    const confirmPassword = await dialog.prompt({
      title: "Konfirmasi Password",
      message: "Ulangi password baru.",
      placeholder: "Ulangi password",
      password: true,
    })
    if (confirmPassword !== newPassword) {
      await dialog.alert("Konfirmasi password tidak sama")
      return
    }

    setUpdatingId(userId)
    try {
      await axios.put(`${API}/users/${userId}/password`, { password: newPassword })
      setData(prev => prev.map(u => u.id === userId ? { ...u, must_change_password: false } : u))
      await dialog.alert("Password pengguna berhasil diperbarui")
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal mengubah password")
    } finally {
      setUpdatingId(null)
    }
  }

  const columns = [
    {
      id: "identifier",
      header: "NIP / NIS",
      cell: ({ row }: any) => (
        <span className="font-mono text-sm font-medium">{row.original.identifier}</span>
      ),
    },
    {
      id: "status",
      header: "Status Akun",
      cell: ({ row }: any) => {
        const u = row.original
        return (
          <div className="flex gap-2">
            {u.is_active ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Aktif</Badge>
            ) : (
              <Badge variant="destructive">Nonaktif</Badge>
            )}
            {u.must_change_password && (
              <Badge variant="outline" className="text-yellow-600 gap-1 bg-yellow-50 hover:bg-yellow-50">
                <KeyRound className="h-3 w-3" /> Default Pwd
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "role",
      header: "Role / Hak Akses",
      cell: ({ row }: any) => {
        const u = row.original

        // Prevent changing own role or if not admin
        if (!isAdmin || u.id === user?.id) {
          return <Badge variant={roleBadgeColor[u.role] || "outline"}>{roleMap[u.role] || u.role}</Badge>
        }

        return (
          <Select
            disabled={updatingId === u.id}
            value={u.role}
            onValueChange={(val) => handleRoleChange(u.id, val)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="kepala_sekolah">Kepala Sekolah</SelectItem>
              <SelectItem value="guru">Guru</SelectItem>
              <SelectItem value="siswa">Siswa</SelectItem>
              <SelectItem value="wali_murid">Wali Murid</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }: any) => {
        const u = row.original
        if (!isAdmin || u.id === user?.id) return null
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={updatingId === u.id}
              onClick={() => handlePasswordChange(u.id)}
            >
              Ubah Password
            </Button>
            <span className="text-xs text-muted-foreground mr-2">
              {u.is_active ? "Nonaktifkan" : "Aktifkan"}
            </span>
            <Switch
              checked={u.is_active}
              disabled={updatingId === u.id}
              onCheckedChange={() => handleStatusChange(u.id, u.is_active)}
            />
          </div>
        )
      },
    }
  ]

  if (!isAdmin) {
    return (
      <PageShell title="Akses Ditolak" description="Anda tidak memiliki izin">
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5" />
          <p>Hanya Admin yang dapat mengakses halaman ini.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Manajemen Pengguna"
      description="Kelola hak akses pengguna (Role) dan status akun."
    >
      <div className="flex flex-col gap-4">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          pageCount={totalPages}
          pageIndex={page}
          onPageChange={setPage}
          searchPlaceholder="Cari berdasarkan NIP / NIS..."
          searchValue={search}
          onSearchChange={handleSearchChange}
          totalItems={totalItems}
          emptyMessage={search ? "Pengguna tidak ditemukan" : "Belum ada pengguna"}
        />
      </div>
    </PageShell>
  )
}
