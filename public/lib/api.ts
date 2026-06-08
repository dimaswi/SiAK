const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const INTERNAL_API_BASE = process.env.INTERNAL_API_BASE || "http://localhost:8080/api";
const API_BASE = typeof window === "undefined" ? INTERNAL_API_BASE : PUBLIC_API_BASE;
const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE || PUBLIC_API_BASE.replace(/\/api$/, "")).replace(/\/$/, "");

async function safeFetchJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchSiteConfig() {
  return safeFetchJson(`/public/site-config`, null, { next: { revalidate: 60 } });
}

export async function fetchPublicPosts() {
  return safeFetchJson(`/public/cms/posts`, [], { next: { revalidate: 60 } });
}

export async function fetchPublicPostBySlug(slug: string) {
  return safeFetchJson(`/public/cms/posts/${slug}`, null, { next: { revalidate: 60 } });
}

export async function fetchNavigation(location = "header") {
  return safeFetchJson(`/public/cms/navigation?location=${location}`, [], { next: { revalidate: 60 } });
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
