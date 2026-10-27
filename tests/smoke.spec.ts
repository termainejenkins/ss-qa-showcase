import { test, expect } from './support/fixtures';
import { openHtml, trackPageHealth } from './support/page-health';
import { FILE_ROUTES, HTML_ROUTES } from './support/routes';
import { originFrom } from './support/site';

test.describe('smoke', () => {
  for (const route of HTML_ROUTES) {
    test(`${route.name} (${route.path}) loads with a title and one h1`, async ({ page }, testInfo) => {
      const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
      const health = trackPageHealth(page, origin);
      const response = await openHtml(page, route.path);

      expect(response, 'navigation produced no response').not.toBeNull();
      expect(response!.status(), route.path).toBe(200);
      await expect(page).toHaveTitle(/\S/);
      await expect(page).toHaveTitle(/Sentient Solutions/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(route.h1);
      expect(health.consoleErrors, health.consoleErrors.join('\n')).toEqual([]);
      expect(health.failedSameOrigin, health.failedSameOrigin.join('\n')).toEqual([]);
    });
  }

  for (const route of FILE_ROUTES) {
    test(`${route.path} returns 200`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toMatch(route.contentType);
      expect((await response.text()).trim().length).toBeGreaterThan(0);
    });
  }
});
