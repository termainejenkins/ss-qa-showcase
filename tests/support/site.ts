/**
 * Host the suite opens in the browser. CI sets this.
 * sentientsolutions.dev serves the same pages, but that host injects a
 * Cloudflare Web Analytics beacon (POST /cdn-cgi/rum). The read-only page
 * fixture rejects that request, so browser checks stay on this origin.
 */
export const DEFAULT_SITE_ORIGIN = 'https://sentientsolutions-site.pages.dev';

/** Canonical links, sitemap locs, and the robots.txt Sitemap line use this origin. */
export const CANONICAL_ORIGIN = 'https://sentientsolutions.dev';

/** SITE_URL is an origin. A path, query, or hash on the env value is ignored. */
export function resolveSiteOrigin(raw = process.env.SITE_URL): string {
  const value = raw?.trim() || DEFAULT_SITE_ORIGIN;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL is not a valid URL: ${value}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`SITE_URL must be http(s): ${value}`);
  }
  return url.origin;
}

export function originFrom(baseURL: string | undefined): string {
  return new URL(baseURL || DEFAULT_SITE_ORIGIN).origin;
}

export function pageUrl(origin: string, path: string): string {
  return new URL(path, origin).href;
}

/** Full-URL match. A `/` suffix on a regex is not specific enough. */
export function exactPage(origin: string, path: string): RegExp {
  const escaped = pageUrl(origin, path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`);
}
