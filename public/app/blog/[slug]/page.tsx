import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicPostBySlug, resolveAssetUrl } from "../../../lib/api";

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPublicPostBySlug(slug);
  if (!post) return notFound();

  return (
    <div className="container section--spacious">
      <div className="section-header">
        <div>
          <span className="eyebrow">Artikel</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt || "Artikel resmi sekolah yang dipublikasikan melalui portal publik."}</p>
        </div>
        <Link href="/blog" className="btn">Kembali ke Blog</Link>
      </div>

      {post.cover_image_url ? (
        <div className="article-cover">
          <img src={resolveAssetUrl(post.cover_image_url)} alt={post.title} />
        </div>
      ) : null}

      <section className="section">
        <div className="article-shell">
          <article className="panel article-content">
            <div dangerouslySetInnerHTML={{ __html: post.content || "<p>Konten artikel tidak tersedia.</p>" }} />
          </article>
          <aside className="aside-note">
            <div className="card status-card">
              <span className="eyebrow">Informasi Artikel</span>
              <div style={{ margin: "16px 0" }}>
                <div style={{ marginBottom: 16 }}>
                  <span className="muted" style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tanggal Rilis</span>
                  <strong style={{ fontSize: 16 }}>{post.published_at ? new Date(post.published_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(post.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
                <div>
                  <span className="muted" style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</span>
                  <strong style={{ fontSize: 16 }}>{post.status === "published" ? "Dipublikasikan" : "Draft Internal"}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
