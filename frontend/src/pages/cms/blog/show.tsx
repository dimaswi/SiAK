import { useEffect, useState } from "react"
import axios from "axios"
import { Link, useParams } from "react-router-dom"
import PageShell from "../../../components/PageShell"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"

const API = "http://localhost:8080/api"
const ASSET_BASE = "http://localhost:8080"

export default function CMSBlogShow() {
  const { id } = useParams()
  const [item, setItem] = useState<any>(null)

  useEffect(() => {
    const run = async () => {
      const res = await axios.get(`${API}/cms/posts`)
      setItem((res.data || []).find((x: any) => x.id === id) || null)
    }
    run()
  }, [id])

  if (!item) return <PageShell title="Show Blog Post" description="Data tidak ditemukan."><div /></PageShell>

  return (
    <PageShell
      title={`Show: ${item.title}`}
      description="Detail artikel blog."
      footer={
        <>
          <Button size="sm" asChild variant="outline"><Link to="/cms/blog">Kembali</Link></Button>
          <Button size="sm" asChild variant="secondary"><Link to={`/cms/blog/${item.id}/edit`}>Edit</Link></Button>
        </>
      }
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge>
            <p className="text-xs text-slate-400 font-mono">/{item.slug}</p>
          </div>
          {item.cover_image_url ? (
            <img src={`${ASSET_BASE}${item.cover_image_url}`} alt="cover" className="h-52 w-full rounded-md border border-slate-200 object-cover shadow-sm" />
          ) : null}
          <div className="rounded-md border border-slate-200 p-4 bg-slate-50/50 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
        </div>
      </div>
    </PageShell>
  )
}
