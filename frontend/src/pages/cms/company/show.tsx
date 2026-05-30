import { useEffect, useState } from "react"
import axios from "axios"
import { Link, useParams } from "react-router-dom"
import PageShell from "../../../components/PageShell"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"

const API = "http://localhost:8080/api"

export default function CMSCompanyShow() {
  const { id } = useParams()
  const [item, setItem] = useState<any>(null)

  useEffect(() => {
    const run = async () => {
      const res = await axios.get(`${API}/cms/pages`)
      setItem((res.data || []).find((x: any) => x.id === id) || null)
    }
    run()
  }, [id])

  if (!item) return <PageShell title="Show Company Profile" description="Data tidak ditemukan."><div /></PageShell>

  return (
    <PageShell
      title={`Show: ${item.title}`}
      description="Detail halaman profile."
      footer={
        <>
          <Button size="sm" asChild variant="outline"><Link to="/cms/company">Kembali</Link></Button>
          <Button size="sm" asChild variant="secondary"><Link to={`/cms/company/${item.id}/edit`}>Edit</Link></Button>
        </>
      }
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={item.is_published ? "default" : "secondary"}>{item.is_published ? "Published" : "Draft"}</Badge>
            <p className="text-xs text-slate-400 font-mono">Key: {item.key}</p>
          </div>
          <div className="rounded-md border border-slate-200 p-4 bg-slate-50/50 text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
        </div>
      </div>
    </PageShell>
  )
}
