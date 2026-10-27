import { test, expect } from './support/fixtures';
import { exactPage, originFrom } from './support/site';

test('an unknown route returns the 404 page with a link home', async ({ page }, testInfo) => {
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const response = await page.goto('/this-page-is-not-on-the-site/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Page not found');
  await expect(page.getByText('That address is not on this site. Try one of these.')).toBeVisible();

  const home = page.locator('main a[href="/"]');
  await expect(home).toBeVisible();
  await expect(home).toContainText('Home');
  await home.click();
  await expect(page).toHaveURL(exactPage(origin, '/'));
  await expect(page.locator('h1')).toHaveText('Autonomous software, games & automation.');
});
