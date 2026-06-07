import Link from "next/link";
import { fetchSiteConfig, fetchPublicPosts, resolveAssetUrl, extractFirstImage } from "../lib/api";

export default async function HomePage() {
  const [config, posts] = await Promise.all([
    fetchSiteConfig(),
    fetchPublicPosts(),
  ]);

  const featuredPosts = (posts || []).slice(0, 3);

  const heroTitle = config?.hero_title || "CRAFTING EDUCATIONAL EXCELLENCE";
  const heroDesc = config?.hero_description || "Portal resmi sekolah untuk informasi pendaftaran dan kegiatan akademik. Membangun generasi cerdas dan berkarakter.";
  const cta1Text = config?.hero_cta_1_text || "Daftar PPDB";
  const cta1Url = config?.hero_cta_1_url || "/ppdb";
  const cta2Text = config?.hero_cta_2_text || "Lihat Portfolio";
  const cta2Url = config?.hero_cta_2_url || "/blog";

  let stats = [
    { label: config?.stat_1_label, value: config?.stat_1_value },
    { label: config?.stat_2_label, value: config?.stat_2_value },
    { label: config?.stat_3_label, value: config?.stat_3_value },
    { label: config?.stat_4_label, value: config?.stat_4_value },
    { label: config?.stat_5_label, value: config?.stat_5_value },
  ].filter(s => s.label && s.value);

  // Jika admin belum mengisi satupun stat di CMS, tampilkan dummy default agar layout tidak kosong
  if (stats.length === 0) {
    stats = [
      { label: "Total Siswa", value: "500+" },
      { label: "Total Guru", value: "50+" },
      { label: "Pendaftar", value: "100+" },
    ];
  }

  const aboutTitle = config?.about_title || "Tentang Kami";
  const aboutDesc = config?.about_content || "<p>Wajah resmi sekolah di ruang publik. Kami hadir untuk memberikan informasi terkini secara transparan dan mudah diakses.</p>";

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* 1. Hero Section - Pure Nordic Digital Style */}
      <section className="hero-nordic">
        <div className="hero-nordic__content">
          <h1>{heroTitle}</h1>
          <p className="hero-nordic__desc">{heroDesc}</p>
          <div className="hero-nordic__actions">
            <Link href={cta1Url} className="btn-primary">{cta1Text}</Link>
            <Link href={cta2Url} className="btn-secondary">{cta2Text}</Link>
          </div>
        </div>
        <div className="hero-nordic__graphic">
          <img src={config?.hero_image_url ? resolveAssetUrl(config.hero_image_url) : "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop"} alt="Hero Illustration" className="neo-illustration" />
        </div>
      </section>

      {/* 2. Stats Section (Moved below as requested) */}
      {stats.length > 0 && (
        <section className="section stats-row" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}>
          {stats.map((st, i) => (
            <div key={i} className="stat-item">
              <div className="stat-val">{st.value}</div>
              <div className="stat-label">{st.label}</div>
            </div>
          ))}
        </section>
      )}

      {/* 3. About Section (Scroll down to see) */}
      <section className="section about-nordic mt-12">
        <div className="about-nordic__grid">
          <div className="about-nordic__image">
            <img src={config?.about_image_url ? resolveAssetUrl(config.about_image_url) : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"} alt="Tentang Sekolah" className="neo-illustration" />
          </div>
          <div className="about-nordic__content">
            <h2>{aboutTitle}</h2>
            <div className="story-copy" dangerouslySetInnerHTML={{ __html: aboutDesc }} />
          </div>
        </div>
      </section>

      {/* 4. Programs / Features (Optional, keeping it clean) */}
      <section className="section mt-12">
        <div className="section-header">
          <div><h2>Fasilitas & Program</h2></div>
        </div>
        <div className="programs-grid">
          {[1, 2, 3, 4].map(num => {
            const title = (config as any)?.[`program_${num}_title`];
            const desc = (config as any)?.[`program_${num}_desc`];
            if (!title) return null;
            return (
              <div key={num} className="card program-card">
                <h3>{title}</h3>
                <p className="muted">{desc}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
}
