import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { fetchNavigation, fetchSiteConfig, resolveAssetUrl } from "../lib/api";
import Navigation from "../components/Navigation";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();

  return {
    title: config?.school_name || "Portal Publik",
    description: config?.school_tagline || "Portal resmi",
    icons: {
      icon: config?.logo_url ? resolveAssetUrl(config.logo_url) : "/favicon.ico",
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headerNav, footerNav, config] = await Promise.all([
    fetchNavigation("header"),
    fetchNavigation("footer"),
    fetchSiteConfig(),
  ]);

  const schoolName = config?.school_name || "Sekolah";
  const logoUrl = config?.logo_url ? resolveAssetUrl(config.logo_url) : undefined;

  const footerDesc = config?.footer_description || "Portal resmi sekolah.";
  const address = config?.footer_address;
  const phone = config?.footer_phone;
  const email = config?.footer_email;

  return (
    <html lang="id">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="brand">
                {logoUrl ? (
                  <div className="brand__logo"><img src={logoUrl} alt={schoolName} /></div>
                ) : (
                  <div className="brand__seal">{schoolName.charAt(0)}</div>
                )}
                <div className="brand__meta">
                  <strong className="brand__title">{schoolName}</strong>
                </div>
              </Link>

              <input type="checkbox" id="mobile-menu-toggle" className="mobile-menu-toggle-checkbox" hidden />
              <label htmlFor="mobile-menu-toggle" className="mobile-menu-toggle-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </label>
              <label htmlFor="mobile-menu-toggle" className="mobile-menu-overlay"></label>

              <div className="header-nav-container">
                <Navigation items={headerNav} />
                {/* <Link href={config?.hero_cta_1_url || "/ppdb"} className="btn-header">
                  {config?.hero_cta_1_text || "Daftar PPDB"}
                </Link> */}
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div className="container">
              <div className="footer-grid">
                <div className="footer-brand">
                  <Link href="/" className="brand">
                    {logoUrl ? (
                      <div className="brand__logo"><img src={logoUrl} alt={schoolName} /></div>
                    ) : (
                      <div className="brand__seal">{schoolName.charAt(0)}</div>
                    )}
                    <div className="brand__meta">
                      <strong className="brand__title">{schoolName}</strong>
                    </div>
                  </Link>
                  <p className="footer-desc mt-4">{footerDesc}</p>
                </div>

                <div className="footer-links">
                  <strong>Navigasi</strong>
                  <div className="nav-footer">
                    <Navigation items={footerNav} />
                  </div>
                </div>

                <div className="footer-contact">
                  <strong>Hubungi Kami</strong>
                  {email && <p>{email}</p>}
                  {phone && <p>{phone}</p>}
                  {address && <p>{address}</p>}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
