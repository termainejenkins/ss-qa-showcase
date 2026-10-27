import type { Page } from '@playwright/test';

export type PageHealth = {
  consoleErrors: string[];
  failedSameOrigin: string[];
};

/** Record console errors and failed same-origin responses for the rest of the test. */
export function trackPageHealth(page: Page, origin: string): PageHealth {
  const health: PageHealth = { consoleErrors: [], failedSameOrigin: [] };

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const location = msg.location();
    const where = location.url ? ` @ ${location.url}:${location.lineNumber}` : '';
    health.consoleErrors.push(`${msg.text()}${where}`);
  });

  page.on('pageerror', (error) => {
    health.consoleErrors.push(error.message);
  });

  page.on('requestfailed', (req) => {
    if (!sameOrigin(req.url(), origin)) return;
    health.failedSameOrigin.push(`${req.failure()?.errorText ?? 'failed'} ${req.url()}`);
  });

  page.on('response', (res) => {
    if (!sameOrigin(res.url(), origin) || res.status() < 400) return;
    health.failedSameOrigin.push(`${res.status()} ${res.url()}`);
  });

  return health;
}

function sameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

export async function openHtml(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('h1').first().waitFor({ state: 'visible' });
  await page.waitForLoadState('load');
  // Third-party embeds (Steam) often never go idle. Cap the wait, then read what failed.
  await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
  return response;
}
