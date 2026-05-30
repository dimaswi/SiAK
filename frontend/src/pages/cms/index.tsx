import { Link } from "react-router-dom"
import PageShell from "../../components/PageShell"
import { Button } from "../../components/ui/button"

export default function CMSIndex() {
  return (
    <PageShell title="CMS Portal" description="Pilih modul CMS yang ingin Anda kelola.">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">Company Profile</h4>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 leading-relaxed">Kelola halaman profil sekolah (home, about, visi-misi, kontak).</p>
            </div>
          </div>
          <div className="p-4 pt-0">
            <Button size="sm" className="w-full" asChild><Link to="/cms/company">Buka Modul</Link></Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">Blog</h4>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 leading-relaxed">Kelola artikel blog sekolah dengan workflow publish.</p>
            </div>
          </div>
          <div className="p-4 pt-0">
            <Button size="sm" className="w-full" asChild><Link to="/cms/blog">Buka Modul</Link></Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">Navigasi</h4>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 leading-relaxed">Pengaturan menu header/footer untuk portal publik.</p>
            </div>
          </div>
          <div className="p-4 pt-0">
            <Button size="sm" className="w-full" asChild><Link to="/cms/navigation">Buka Modul</Link></Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
