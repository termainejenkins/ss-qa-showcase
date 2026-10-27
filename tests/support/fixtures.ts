import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { originFrom } from './site';

/**
 * While a page is open, same-origin and workers.dev traffic may only be GET or HEAD.
 * Same-origin `/api/` and any workers.dev host fail the test even for GET.
 * Requests made by third-party embeds (the Steam widget, for example) are not
 * treated as this suite calling an API.
 */
function watchReadOnly(page: Page, testInfo: TestInfo): string[] {
  const bad: string[] = [];
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  page.on('request', (req) => {
    let url: URL;
    try {
      url = new URL(req.url());
    } catch {
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    const method = req.method();
    const path = `${url.origin}${url.pathname}`;
    const sameOrigin = url.origin === origin;
    const worker = url.hostname === 'workers.dev' || url.hostname.endsWith('.workers.dev');
    if ((sameOrigin || worker) && method !== 'GET' && method !== 'HEAD') {
      bad.push(`${method} ${path}`);
    }
    if (worker) bad.push(`worker ${method} ${path}`);
    if (sameOrigin && (url.pathname === '/api' || url.pathname.startsWith('/api/'))) {
      bad.push(`api ${method} ${path}`);
    }
  });
  return bad;
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const bad = watchReadOnly(page, testInfo);
    await use(page);
    expect(bad, `Read-only rule violated:\n${bad.join('\n')}`).toEqual([]);
  },
});

export { expect };
