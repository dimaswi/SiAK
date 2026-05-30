import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { fetchNavigation, fetchPublicPage } from "../lib/api";
import Navigation from "../components/Navigation";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await fetchPublicPage("global-brand");
  
  let iconSrc = "/favicon.ico";
  if (brand?.content && brand.content.includes("<img")) {
    const match = brand.content.match(/src="([^"]+)"/);
    if (match && match[1]) {
      iconSrc = match[1];
    }
  }

  return {
    title: brand?.title || "Portal Publik Sekolah",
    description: "Company profile sekolah, blog resmi, dan PPDB online.",
    icons: {
      icon: iconSrc,
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headerNav, footerNav, brand, footer] = await Promise.all([
    fetchNavigation("header"),
    fetchNavigation("footer"),
    fetchPublicPage("global-brand"),
    fetchPublicPage("global-footer"),
  ]);

  const brandEyebrow = brand?.meta_title || "Portal Publik";
  const brandTitle = brand?.title || "Sekolah Inspiratif";
  const brandSeal = brand?.content || "S";

  const footerTitle = footer?.title || "Portal Sekolah";
  const footerContent = footer?.content || "<p>Profil institusi, publikasi kegiatan, dan pintu masuk layanan calon siswa baru.</p>";

  return (
    <html lang="id">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="brand">
                {brandSeal.includes("<img") ? (
                  <div className="brand__logo" dangerouslySetInnerHTML={{ __html: brandSeal }} />
                ) : (
                  <div className="brand__seal" dangerouslySetInnerHTML={{ __html: brandSeal }} />
                )}
                <div className="brand__meta">
                  <span className="brand__eyebrow">{brandEyebrow}</span>
                  <strong className="brand__title">{brandTitle}</strong>
                </div>
              </Link>
              
              {/* CSS-only Mobile Sidebar Hack */}
              <input type="checkbox" id="mobile-menu-toggle" className="mobile-menu-toggle-checkbox" hidden />
              <label htmlFor="mobile-menu-toggle" className="mobile-menu-toggle-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </label>
              
              <label htmlFor="mobile-menu-toggle" className="mobile-menu-overlay"></label>

              <Navigation items={headerNav} />
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div className="container">
              <div className="site-footer__box">
                <div>
                  <strong>{footerTitle}</strong>
                  <div dangerouslySetInnerHTML={{ __html: footerContent }} />
                </div>
                <Navigation items={footerNav} />
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
