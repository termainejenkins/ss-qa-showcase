import { test, expect } from './support/fixtures';
import { openHtml } from './support/page-health';
import {
  FOOTER_EXTERNAL_URLS,
  FOOTER_INTERNAL_PATHS,
  HEADER_LINKS,
  HTML_ROUTES,
} from './support/routes';
import { exactPage, originFrom } from './support/site';

function h1For(path: string): string {
  const route = HTML_ROUTES.find((item) => item.path === path);
  if (!route) throw new Error(`No expected h1 for ${path}`);
  return route.h1;
}

test.describe('header navigation', () => {
  test('primary nav links open the right pages', async ({ page }, testInfo) => {
    const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
    const nav = page.getByRole('navigation', { name: 'Primary' });

    for (const link of HEADER_LINKS) {
      await test.step(link.name, async () => {
        await openHtml(page, '/');
        await nav.getByRole('link', { name: link.name, exact: true }).click();
        await expect(page).toHaveURL(exactPage(origin, link.path));
        await expect(page.locator('h1')).toHaveText(h1For(link.path));
      });
    }
  });

  test('logo link returns home', async ({ page }, testInfo) => {
    const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
    await openHtml(page, '/about/');
    await page.getByRole('link', { name: 'Sentient Solutions LLC, home' }).click();
    await expect(page).toHaveURL(exactPage(origin, '/'));
    await expect(page.locator('h1')).toHaveText(h1For('/'));
  });
});

test.describe('footer', () => {
  test('footer links are the expected set and each internal link opens', async ({ page }, testInfo) => {
    const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
    await openHtml(page, '/');
    const hrefs = await page.locator('footer a').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href') ?? ''),
    );

    const internal = [...new Set(hrefs.filter((href) => href.startsWith('/')))].sort();
    const external = [...new Set(hrefs.filter((href) => href.startsWith('http')))].sort();
    const mailto = hrefs.filter((href) => href.startsWith('mailto:'));

    expect(internal).toEqual([...FOOTER_INTERNAL_PATHS].sort());
    expect(external).toEqual([...FOOTER_EXTERNAL_URLS].sort());
    expect(mailto).toContain('mailto:studio@sentientsolutions.dev');

    for (const path of FOOTER_INTERNAL_PATHS) {
      await test.step(path, async () => {
        await openHtml(page, '/');
        await page.locator(`footer a[href="${path}"]`).first().click();
        await expect(page).toHaveURL(exactPage(origin, path));
        await expect(page.locator('h1')).toHaveText(h1For(path));
      });
    }
  });
});
