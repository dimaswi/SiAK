import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, UserPlus, Users, Trash2, Search } from "lucide-react"

import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"
import { DataTable } from "../../components/DataTable"
import { useAuth } from "../../context/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Checkbox } from "../../components/ui/checkbox"
import { Input } from "../../components/ui/input"
import { useAppDialog } from "../../context/AppDialogContext"

const API = "http://localhost:8080/api"

interface ClassItem {
  id: string
  name: string
  grade_level: number
  academic_year: string
  homeroom_teacher_name: string
  student_count: number
}

interface StudentInfo {
  id: string
  nis: string
  full_name: string
  gender: string
  class_id?: string // for the modal
}

export default function ClassShow() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const dialog = useAppDialog()
  const isAdmin = user?.role === "admin" || user?.role === "kepala_sekolah"

  const [classData, setClassData] = useState<ClassItem | null>(null)
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Unassigned students for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [unassignedStudents, setUnassignedStudents] = useState<StudentInfo[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)
  const [modalSearch, setModalSearch] = useState("")

  const filteredUnassignedStudents = unassignedStudents.filter(s =>
    s.full_name.toLowerCase().includes(modalSearch.toLowerCase()) ||
    s.nis.toLowerCase().includes(modalSearch.toLowerCase())
  )

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [classRes, studentsRes] = await Promise.all([
        axios.get(`${API}/classes/${id}`),
        axios.get(`${API}/classes/${id}/students`),
      ])
      setClassData(classRes.data)
      setStudents(studentsRes.data || [])
    } catch (err: any) {
      console.error("Gagal mengambil data detail kelas:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const openAssignModal = async () => {
    try {
      // Fetch all active students and filter those without a class, or in another class
      const res = await axios.get(`${API}/students?limit=1000`)
      const allStudents: StudentInfo[] = res.data.data || []
      // We only want students not in THIS class
      setUnassignedStudents(allStudents.filter(s => s.class_id !== id))
      setSelectedStudentIds(new Set())
      setIsModalOpen(true)
    } catch (err) {
      await dialog.alert("Gagal mengambil daftar siswa")
    }
  }

  const toggleSelectStudent = (studentId: string) => {
    const next = new Set(selectedStudentIds)
    if (next.has(studentId)) next.delete(studentId)
    else next.add(studentId)
    setSelectedStudentIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === unassignedStudents.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(unassignedStudents.map(s => s.id)))
    }
  }

  const handleAssign = async () => {
    if (selectedStudentIds.size === 0) return
    setIsAssigning(true)
    try {
      await axios.post(`${API}/classes/${id}/assign-students`, {
        student_ids: Array.from(selectedStudentIds)
      })
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal memasukkan siswa ke kelas")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemove = async (studentId: string, name: string) => {
    const confirmed = await dialog.confirm(`Keluarkan ${name} dari kelas ini?`)
    if (!confirmed) return
    try {
      await axios.post(`${API}/classes/remove-student/${studentId}`)
      fetchData()
    } catch (err: any) {
      await dialog.alert(err.response?.data?.message || "Gagal mengeluarkan siswa")
    }
  }

  const columns = [
    {
      id: "nis",
      header: "NIS",
      cell: ({ row }: any) => <span className="font-mono text-sm font-medium">{row.original.nis}</span>,
    },
    {
      id: "name",
      header: "Nama Siswa",
      cell: ({ row }: any) => (
        <Link to={`/siswa/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.original.full_name}
        </Link>
      ),
    },
    {
      id: "gender",
      header: "L/P",
      cell: ({ row }: any) => <span className="text-sm">{row.original.gender}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }: any) => (
        isAdmin ? (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(row.original.id, row.original.full_name)}
              title="Keluarkan dari kelas"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Keluarkan</span>
            </Button>
          </div>
        ) : null
      ),
    },
  ]

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!classData) return null

  return (
    <PageShell
      title={`Detail Kelas: ${classData.name}`}
      description={`Tahun Ajaran ${classData.academic_year}`}
      backButton={
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
          <Link to="/classes"><ArrowLeft className="w-4 h-4 text-slate-600" /></Link>
        </Button>
      }
      actions={
        isAdmin ? (
          <Button size="sm" onClick={openAssignModal} className="gap-2 shrink-0 shadow-xs">
            <UserPlus className="h-4 w-4" /> Assign Murid
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 pb-8">
        {/* Class Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wali Kelas</p>
              <p className="text-sm font-bold text-slate-900">{classData.homeroom_teacher_name || "Belum Ditentukan"}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total Siswa</p>
              <p className="text-sm font-bold text-slate-900">{students.length} Siswa</p>
            </div>
          </div>
        </div>

        {/* Students Table */}

        <DataTable
          columns={columns}
          data={students}
          isLoading={isLoading}
          pageCount={1}
          pageIndex={1}
          onPageChange={() => { }}
          searchPlaceholder="Cari siswa..."
          searchValue=""
          onSearchChange={() => { }}
          totalItems={students.length}
          emptyMessage="Belum ada siswa di kelas ini"
        />

      </div>

      {/* Assign Students Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Assign Murid ke Kelas {classData.name}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan Nama atau NIS..."
                className="pl-9 bg-muted/40 border-muted focus-visible:ring-primary/20"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={selectedStudentIds.size > 0 && selectedStudentIds.size === filteredUnassignedStudents.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">NIS</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nama Siswa</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnassignedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-8 w-8 mb-2 opacity-20" />
                          <p>Tidak ada siswa yang sesuai pencarian.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnassignedStudents.map(s => (
                      <TableRow
                        key={s.id}
                        className={`cursor-pointer transition-colors ${selectedStudentIds.has(s.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleSelectStudent(s.id)}
                      >
                        <TableCell className="text-center" onClick={(e: any) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedStudentIds.has(s.id)}
                            onCheckedChange={() => toggleSelectStudent(s.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                        <TableCell className="font-medium text-sm">{s.full_name}</TableCell>
                        <TableCell>
                          {s.class_id ? (
                            <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                              Kelas Lain
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                              Belum Ada Kelas
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/10 sm:justify-between items-center flex-row">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedStudentIds.size}</span> dari <span className="font-medium text-foreground">{filteredUnassignedStudents.length}</span> terpilih
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="button" onClick={handleAssign} disabled={isAssigning || selectedStudentIds.size === 0} className="shadow-sm">
                {isAssigning ? "Menyimpan..." : "Assign ke Kelas"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
