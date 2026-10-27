import { test, expect } from './support/fixtures';
import { fetchReadOnly } from './support/http';
import { openHtml } from './support/page-health';
import { HTML_ROUTES } from './support/routes';
import { parseRobotsSitemap, parseSitemapLastmods, parseSitemapLocs } from './support/sitemap';
import { originFrom } from './support/site';

test.describe('canonical and meta description', () => {
  for (const route of HTML_ROUTES) {
    test(`${route.name} (${route.path}) has a canonical URL and a description`, async ({ page }, testInfo) => {
      const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
      const response = await openHtml(page, route.path);
      expect(response?.status()).toBe(200);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(new URL(route.path, origin).href);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.trim().length ?? 0).toBeGreaterThan(0);
    });
  }
});

test('html routes without a trailing slash redirect to the slash form', async ({ request }, testInfo) => {
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);

  for (const route of HTML_ROUTES) {
    if (route.path === '/') continue;
    const bare = route.path.replace(/\/$/, '');
    const response = await request.fetch(bare, { method: 'GET', maxRedirects: 0, failOnStatusCode: false });
    expect(response.status(), bare).toBe(308);
    const location = response.headers()['location'] ?? '';
    expect([route.path, new URL(route.path, origin).href], `${bare} -> ${location}`).toContain(location);
  }
});

test('robots.txt allows crawling and names the sitemap', async ({ request }, testInfo) => {
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const response = await fetchReadOnly(request, 'GET', new URL('/robots.txt', origin).href);
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toMatch(/User-agent:\s*\*/i);
  expect(body).toMatch(/Allow:\s*\//);
  expect(parseRobotsSitemap(body)).toBe(new URL('/sitemap.xml', origin).href);
});

test('sitemap.xml is well formed and every URL in it loads', async ({ request }, testInfo) => {
  test.setTimeout(120_000);
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const response = await fetchReadOnly(request, 'GET', new URL('/sitemap.xml', origin).href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type'] ?? '').toMatch(/xml/);
  const xml = await response.text();
  expect(xml.trimStart().startsWith('<?xml')).toBeTruthy();

  const locs = parseSitemapLocs(xml);
  for (const lastmod of parseSitemapLastmods(xml)) {
    expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}/);
  }

  const paths = locs.map((loc) => new URL(loc).pathname);
  for (const route of HTML_ROUTES) {
    expect(paths, `sitemap is missing ${route.path}`).toContain(route.path);
  }

  const failures: string[] = [];
  for (const loc of locs) {
    const url = new URL(loc);
    expect(url.origin, loc).toBe(origin);
    const page = await fetchReadOnly(request, 'GET', url.href);
    if (page.status() !== 200) failures.push(`${page.status()} ${url.pathname}`);
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('rss.xml is an RSS 2.0 channel', async ({ request }, testInfo) => {
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const response = await fetchReadOnly(request, 'GET', new URL('/rss.xml', origin).href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type'] ?? '').toMatch(/xml/);
  const text = await response.text();
  expect(text).toMatch(/<rss\b[^>]*\bversion=["']2\.0["']/);
  expect(text).toContain('<channel>');
  expect(text).toContain('Sentient Solutions');
});
