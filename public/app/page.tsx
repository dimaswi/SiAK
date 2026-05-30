import Link from "next/link";
import { fetchPublicPage, fetchPublicPosts, resolveAssetUrl, extractFirstImage } from "../lib/api";

export default async function HomePage() {
  const [
    hero, about, valuesHeader, val1, val2, val3, val4, blogHeader,
    legacyHome, legacyAbout, legacyVision, legacyContact, posts,
    stat1, stat2, highlight1, highlight2, highlight3, highlight4
  ] = await Promise.all([
    fetchPublicPage("home-hero"),
    fetchPublicPage("home-about"),
    fetchPublicPage("home-values"),
    fetchPublicPage("home-value-1"),
    fetchPublicPage("home-value-2"),
    fetchPublicPage("home-value-3"),
    fetchPublicPage("home-value-4"),
    fetchPublicPage("home-blog"),
    fetchPublicPage("home"), // Fallback legacy
    fetchPublicPage("about"), // Fallback legacy
    fetchPublicPage("vision"), // Fallback legacy
    fetchPublicPage("contact"), // Fallback legacy
    fetchPublicPosts(),
    fetchPublicPage("home-stat-1"),
    fetchPublicPage("home-stat-2"),
    fetchPublicPage("home-highlight-1"),
    fetchPublicPage("home-highlight-2"),
    fetchPublicPage("home-highlight-3"),
    fetchPublicPage("home-highlight-4"),
  ]);

  const featuredPosts = (posts || []).slice(0, 3);

  // 1. Hero Section Mapping
  const finalHeroEyebrow = hero?.meta_title || "Profil Institusi";
  const finalHeroTitle = hero?.title || legacyHome?.title || "Sekolah yang membangun karakter, prestasi, dan masa depan.";
  const finalHeroDesc = hero?.meta_description || hero?.content || legacyHome?.meta_description || "Portal resmi sekolah untuk menampilkan cerita institusi, publikasi kegiatan, dan akses PPDB dalam satu pengalaman yang rapi.";

  const finalStat1Title = stat1?.title || "01";
  const finalStat1Desc = stat1?.meta_description || stat1?.content || "Portal profil sekolah, berita, dan akses pendaftaran publik.";

  const finalStat2Title = stat2?.title || featuredPosts.length.toString().padStart(2, "0");
  const finalStat2Desc = stat2?.meta_description || stat2?.content || "Artikel terbaru yang sudah dipublikasikan oleh tim sekolah.";

  // 2. About Section Mapping
  const finalAboutEyebrow = about?.meta_title || "Tentang Kami";
  const finalAboutTitle = about?.title || "Wajah resmi sekolah di ruang publik.";
  const finalAboutContent = about?.content || legacyAbout?.content || legacyHome?.content || "<p>Company profile kami susun agar orang tua, calon siswa, dan mitra bisa memahami nilai, arah, dan kualitas sekolah secara cepat.</p>";

  const finalHi1Title = highlight1?.title || "Visi Institusi";
  const finalHi1Desc = highlight1?.content || highlight1?.meta_description || legacyVision?.title || "Visi & Misi Sekolah";

  const finalHi2Title = highlight2?.title || "Arah Komunikasi";
  const finalHi2Desc = highlight2?.content || highlight2?.meta_description || legacyHome?.meta_title || "Menyampaikan identitas sekolah secara lebih profesional.";

  const finalHi3Title = highlight3?.title || "Kontak Publik";
  const finalHi3Desc = highlight3?.content || highlight3?.meta_description || legacyContact?.meta_description || "Halaman kontak dapat dipakai untuk alamat, nomor sekolah, dan informasi layanan.";

  // 3. Values Section Mapping
  const finalValEyebrow = valuesHeader?.meta_title || "Nilai Sekolah";
  const finalValTitle = valuesHeader?.title || "Komunikasi yang terasa hangat, tertata, dan meyakinkan.";
  const finalValDesc = valuesHeader?.content || valuesHeader?.meta_description || "Portal publik ini tidak hanya menampilkan informasi, tetapi juga membangun kepercayaan melalui cerita, visual, dan struktur konten yang jelas.";

  // 4. Blog Header Mapping
  const finalBlogEyebrow = blogHeader?.meta_title || "Publikasi Terbaru";
  const finalBlogTitle = blogHeader?.title || "Artikel dan cerita yang menjaga portal tetap aktif.";
  const finalBlogDesc = blogHeader?.content || blogHeader?.meta_description; // Kosongkan fallback agar tidak muncul jika tidak diisi

  return (
    <div className="container section--spacious">
      <section className="hero">
        <div className="hero__grid">
          <div style={{ minWidth: 0 }}>
            <span className="eyebrow">{finalHeroEyebrow}</span>
            <h1>{finalHeroTitle}</h1>
            <div className="hero-desc" dangerouslySetInnerHTML={{ __html: finalHeroDesc }} />
            <div className="hero__actions">
              <Link href="/ppdb" className="btn">Daftar PPDB</Link>
              <Link href="/blog" className="btn-outline">Lihat Artikel</Link>
            </div>
          </div>
          <div className="hero__aside">
            <div className="hero-stat">
              <div className="hero-stat__value">{finalStat1Title}</div>
              <div className="hero-stat__label" dangerouslySetInnerHTML={{ __html: finalStat1Desc }} />
            </div>
            <div className="hero-stat">
              <div className="hero-stat__value">{finalStat2Title}</div>
              <div className="hero-stat__label" dangerouslySetInnerHTML={{ __html: finalStat2Desc }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{finalAboutEyebrow}</span>
            <h2>{finalAboutTitle}</h2>
          </div>
        </div>

        <div className="story-grid" style={{ overflow: 'hidden' }}>
          <div className="panel" style={{ minWidth: 0 }}>
            <div className="story-copy" dangerouslySetInnerHTML={{ __html: finalAboutContent }} />
          </div>
          <div className="highlight-list" style={{ minWidth: 0 }}>
            <div className="highlight-item" style={{ overflowWrap: 'break-word' }}>
              <strong>{finalHi1Title}</strong>
              <div className="muted" dangerouslySetInnerHTML={{ __html: finalHi1Desc }} />
            </div>
            <div className="highlight-item" style={{ overflowWrap: 'break-word' }}>
              <strong>{finalHi2Title}</strong>
              <div className="muted" dangerouslySetInnerHTML={{ __html: finalHi2Desc }} />
            </div>
            {highlight3?.title ? (
              <div className="highlight-item">
                <strong>{highlight3.title}</strong>
                <div dangerouslySetInnerHTML={{ __html: highlight3.content || "" }} />
              </div>
            ) : null}
            {highlight4?.title ? (
              <div className="highlight-item">
                <strong>{highlight4.title}</strong>
                <div dangerouslySetInnerHTML={{ __html: highlight4.content || "" }} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{finalValEyebrow}</span>
            <h2>{finalValTitle}</h2>
            {finalValDesc && <div className="section-desc" dangerouslySetInnerHTML={{ __html: finalValDesc }} />}
          </div>
        </div>
        <div className="post-grid">
          <div className="card">
            <h3>{val1?.title || "Akademik yang terarah"}</h3>
            <p className="muted">{val1?.meta_description || val1?.content || "Informasi utama sekolah ditampilkan dalam alur yang mudah dipahami oleh calon siswa dan orang tua."}</p>
          </div>
          <div className="card">
            <h3>{val2?.title || "Publikasi yang hidup"}</h3>
            <p className="muted">{val2?.meta_description || val2?.content || "Artikel blog menjadi ruang untuk membagikan kegiatan, prestasi, dan agenda penting sekolah secara berkala."}</p>
          </div>
          <div className="card">
            <h3>{val3?.title || "Layanan yang terbuka"}</h3>
            <p className="muted">{val3?.meta_description || val3?.content || "PPDB online hadir sebagai pintu awal yang mudah diakses dari website publik sekolah."}</p>
          </div>
          <div className="card">
            <h3>{val4?.title || "Nilai Tambahan"}</h3>
            <p className="muted">{val4?.meta_description || val4?.content || "Isi konten untuk kotak nilai keempat ini dari admin CMS."}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{finalBlogEyebrow}</span>
            <h2>{finalBlogTitle}</h2>
            {finalBlogDesc && <div className="section-desc" dangerouslySetInnerHTML={{ __html: finalBlogDesc }} />}
          </div>
          <Link href="/blog" className="btn">Lihat Semua Artikel</Link>
        </div>

        <div className="post-grid">
          {featuredPosts.length > 0 ? featuredPosts.map((post: any) => (
            <div key={post.id} className="card post-card">
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
              <p className="muted">{post.excerpt || "Baca artikel selengkapnya untuk mengetahui cerita dan kabar terbaru dari sekolah."}</p>
              <div className="post-card__footer">
                <Link href={`/blog/${post.slug}`} className="btn-outline" style={{ display: 'inline-flex' }}>Baca Selengkapnya</Link>
              </div>
            </div>
          )) : (
            <div className="panel">
              <h3>Belum ada artikel publik</h3>
              <p className="muted">Terbitkan artikel dari CMS admin agar portal blog mulai terisi.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
