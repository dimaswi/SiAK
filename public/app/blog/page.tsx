import Link from "next/link";
import { fetchPublicPosts, fetchSiteConfig, resolveAssetUrl, extractFirstImage } from "../../lib/api";

export default async function BlogPage() {
  const [posts, config] = await Promise.all([
    fetchPublicPosts(),
    fetchSiteConfig()
  ]);

  const heroEyebrow = "Jurnal Sekolah";
  const heroTitle = "Blog dan kabar resmi sekolah.";
  const heroContent = "Temukan pengumuman, kegiatan, prestasi, dan cerita yang membentuk identitas sekolah di ruang publik.";

  return (
    <div className="container section--spacious">
      <section className="blog-hero">
        <span className="eyebrow">{heroEyebrow}</span>
        <h1 style={{ margin: '16px 0 10px', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 0.95, letterSpacing: '-0.05em' }}>{heroTitle}</h1>
        <div className="muted" style={{ color: 'rgba(245, 251, 255, 0.82)', maxWidth: 720 }} dangerouslySetInnerHTML={{ __html: heroContent }} />
      </section>

      <section className="section">
        <div className="post-grid">
          {(posts || []).length > 0 ? (posts || []).map((post: any) => (
            <div key={post.id} className="card post-card btn-animated">
              <div className="post-card__media">
                {post.cover_image_url || extractFirstImage(post.content) ? (
                  <img src={resolveAssetUrl(post.cover_image_url) || extractFirstImage(post.content) || ""} alt={post.title} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.2 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
              </div>
              <h3>{post.title}</h3>
              <p className="muted">{post.excerpt || "Artikel ini sudah dipublikasikan dan siap dibaca lebih lanjut."}</p>
              <div className="post-card__footer">
                <Link href={`/blog/${post.slug}`} className="btn-outline" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>Baca Artikel</Link>
              </div>
            </div>
          )) : (
            <div className="panel col-span-3">
              <h2 style={{ marginTop: 0 }}>Belum ada artikel</h2>
              <p className="muted">Publikasikan artikel dari CMS admin agar halaman blog mulai terisi.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
