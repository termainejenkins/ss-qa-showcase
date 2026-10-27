import type { APIRequestContext } from '@playwright/test';
import { test, expect } from './support/fixtures';
import { fetchReadOnly, probeStatus, type Probe } from './support/http';
import { parseSitemapLocs } from './support/sitemap';
import { HTML_ROUTES } from './support/routes';
import { originFrom } from './support/site';
import {
  extractAnchorHrefs,
  forbiddenReason,
  isInstallerPath,
  resolveHttpUrl,
  urlForLog,
} from './support/urls';

/** Third parties often answer bot clients with these. They are skips, not broken links. */
const SKIP_STATUS = new Set([403, 429, 999]);

/** HEAD a same-origin URL. GET only if the server rejects HEAD. Never used for installers. */
async function sameOriginStatus(request: APIRequestContext, url: string): Promise<Probe> {
  if (isInstallerPath(new URL(url).pathname)) return probeStatus(request, url);
  const head = await fetchReadOnly(request, 'HEAD', url);
  if (head.status() !== 405 && head.status() !== 501) {
    return { method: 'HEAD', status: head.status() };
  }
  const got = await fetchReadOnly(request, 'GET', url);
  return { method: 'GET', status: got.status() };
}

test('same-origin links from the sitemap and pages return 200', async ({ request }, testInfo) => {
  test.setTimeout(180_000);
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const urls = new Set<string>();
  const failures: string[] = [];

  const sitemapResponse = await fetchReadOnly(request, 'GET', new URL('/sitemap.xml', origin).href);
  expect(sitemapResponse.status()).toBe(200);
  for (const loc of parseSitemapLocs(await sitemapResponse.text())) {
    const url = resolveHttpUrl(loc, origin);
    if (!url) {
      failures.push(`unparseable sitemap loc ${loc}`);
      continue;
    }
    if (url.origin !== origin) {
      failures.push(`sitemap loc is outside SITE_URL: ${url.href}`);
      continue;
    }
    urls.add(url.href);
  }

  for (const route of HTML_ROUTES) {
    const pageUrl = new URL(route.path, origin).href;
    const response = await fetchReadOnly(request, 'GET', pageUrl);
    expect(response.status(), pageUrl).toBe(200);
    for (const href of extractAnchorHrefs(await response.text())) {
      const url = resolveHttpUrl(href, pageUrl);
      if (!url || url.origin !== origin) continue;
      const reason = forbiddenReason(url, origin);
      if (reason) {
        failures.push(`refused ${url.href} (${reason})`);
        continue;
      }
      urls.add(url.href);
    }
  }

  for (const url of [...urls].sort()) {
    const probe = await sameOriginStatus(request, url);
    if (probe.status !== 200) failures.push(`${probe.method} ${probe.status} ${urlForLog(url)}`);
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

test('external links answer, or are skipped when the host blocks clients', async ({ request }, testInfo) => {
  test.setTimeout(180_000);
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const urls = new Set<string>();

  for (const route of HTML_ROUTES) {
    const pageUrl = new URL(route.path, origin).href;
    const response = await fetchReadOnly(request, 'GET', pageUrl);
    expect(response.status(), pageUrl).toBe(200);
    for (const href of extractAnchorHrefs(await response.text())) {
      const url = resolveHttpUrl(href, pageUrl);
      if (!url || url.origin === origin) continue;
      const reason = forbiddenReason(url, origin);
      expect(reason, url.href).toBeNull();
      urls.add(url.href);
    }
  }

  expect(urls.size, 'expected outbound links on the public site').toBeGreaterThan(0);

  const failures: string[] = [];
  const skipped: string[] = [];

  for (const url of [...urls].sort()) {
    const installer = isInstallerPath(new URL(url).pathname);
    const head = await fetchReadOnly(request, 'HEAD', url);
    let probe: Probe = { method: 'HEAD', status: head.status() };
    if ((probe.status === 405 || probe.status === 501) && installer) {
      probe = await probeStatus(request, url);
    } else if (probe.status === 405 || probe.status === 501) {
      const got = await fetchReadOnly(request, 'GET', url);
      probe = { method: 'GET', status: got.status() };
    }

    if (probe.status >= 200 && probe.status < 400) continue;
    if (SKIP_STATUS.has(probe.status)) {
      skipped.push(`${probe.status} ${urlForLog(url)}`);
      continue;
    }
    failures.push(`${probe.method} ${probe.status} ${urlForLog(url)}`);
  }

  if (skipped.length > 0) {
    console.log(`external links skipped (403/429/999):\n${skipped.join('\n')}`);
    testInfo.annotations.push({
      type: 'warning',
      description: `Skipped ${skipped.length} external link(s) that returned 403, 429, or 999:\n${skipped.join('\n')}`,
    });
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
