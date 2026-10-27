const UNSAFE_SCHEME = /^(mailto|tel|sms|javascript|data):/i;

/** hrefs from `<a>` tags. Fragments and non-http schemes are dropped. */
export function extractAnchorHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(re)) {
    const raw = decodeXml(match[1] ?? match[2] ?? '').trim();
    if (!raw || raw.startsWith('#') || UNSAFE_SCHEME.test(raw)) continue;
    hrefs.push(raw);
  }
  return hrefs;
}

export function decodeXml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

export function resolveHttpUrl(href: string, base: string): URL | null {
  try {
    const url = new URL(href, base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

/** github.com/termainejenkins/<repo>/releases and anything under it. */
export function isGithubReleaseUrl(url: URL): boolean {
  return (
    url.hostname === 'github.com' &&
    /^\/termainejenkins\/[^/]+\/releases(?:\/.*)?$/i.test(url.pathname)
  );
}

export function isInstallerPath(pathname: string): boolean {
  return /\.(exe|msi|msix|zip|dmg|pkg)$/i.test(pathname);
}

/**
 * Endpoints this suite must never request. Third-party `/api/` paths
 * (Steam widget and similar embeds) are not included: loading the public
 * page is allowed to fetch the embeds the site already publishes.
 */
export function forbiddenReason(url: URL, siteOrigin: string): string | null {
  const host = url.hostname.toLowerCase();
  if (host === 'workers.dev' || host.endsWith('.workers.dev')) {
    return 'workers.dev endpoint';
  }
  if (url.origin === siteOrigin && (url.pathname === '/api' || url.pathname.startsWith('/api/'))) {
    return 'same-origin /api endpoint';
  }
  return null;
}

/** Hide signed CDN query strings. Release checks must not log those URLs. */
export function urlForLog(url: string): string {
  try {
    const parsed = new URL(url);
    const signedHost =
      parsed.hostname.endsWith('githubusercontent.com') && parsed.hostname !== 'github.com';
    const signedQuery = ['sig', 'jwt', 'skoid', 'sktid'].some((key) => parsed.searchParams.has(key));
    if (signedHost || signedQuery) return `${parsed.origin}${parsed.pathname} (signed query hidden)`;
    return parsed.href;
  } catch {
    return url;
  }
}
