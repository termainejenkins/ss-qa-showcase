import { decodeXml } from './urls';

export function parseSitemapLocs(xml: string): string[] {
  if (!xml.includes('<urlset') || !xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
    throw new Error('sitemap.xml is missing a urlset in the sitemaps.org namespace');
  }
  const opens = xml.match(/<url\b[^>]*>/g)?.length ?? 0;
  const closes = xml.match(/<\/url>/g)?.length ?? 0;
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeXml(match[1].trim()));
  if (locs.length === 0 || opens !== locs.length || closes !== locs.length) {
    throw new Error(`sitemap.xml structure is inconsistent (url=${opens}/${closes}, loc=${locs.length})`);
  }
  return locs;
}

export function parseSitemapLastmods(xml: string): string[] {
  return [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1].trim());
}

export function parseRobotsSitemap(text: string): string | null {
  const match = text.match(/^Sitemap:\s*(\S+)/im);
  return match?.[1] ?? null;
}
