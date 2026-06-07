const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
const ASSET_BASE = API_BASE.replace(/\/api$/, "");

export async function fetchSiteConfig() {
  const res = await fetch(`${API_BASE}/public/site-config`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPublicPosts() {
  const res = await fetch(`${API_BASE}/public/cms/posts`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPublicPostBySlug(slug: string) {
  const res = await fetch(`${API_BASE}/public/cms/posts/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchNavigation(location = "header") {
  const res = await fetch(`${API_BASE}/public/cms/navigation?location=${location}`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ASSET_BASE}${path}`;
}

export function extractFirstImage(html?: string | null) {
  if (!html) return null;
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1] : null;
}
