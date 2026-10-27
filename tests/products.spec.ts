import { test, expect } from './support/fixtures';
import { openHtml } from './support/page-health';

test.describe('products index', () => {
  test('links to Time Keeper, AutoNote, and SS Game Launcher', async ({ page }) => {
    await openHtml(page, '/products/');
    const main = page.locator('main');
    await expect(main.locator('a[href="/products/timekeeper/"]')).toContainText('Time Keeper');
    await expect(main.locator('a[href="/products/autonote/"]')).toContainText('AutoNote');
    await expect(main.locator('a[href="/games/launcher/"]')).toContainText('SS Game Launcher');
    await expect(main.getByRole('heading', { level: 2, name: 'Time Keeper' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'AutoNote' })).toBeVisible();
  });
});

test.describe('Time Keeper', () => {
  test('renders the Windows download and the MIT source link', async ({ page }) => {
    await openHtml(page, '/products/timekeeper/');
    await expect(page.locator('h1')).toHaveText('Time Keeper');
    await expect(page.getByText(/free, open-source task HUD for Windows/i)).toBeVisible();
    await expect(page.getByText('SHA-256', { exact: true })).toBeVisible();

    const download = page.getByRole('link', { name: 'Download Time Keeper for Windows' });
    await expect(download).toHaveAttribute(
      'href',
      /https:\/\/github\.com\/termainejenkins\/TimeKeeper\/releases\/download\/v\d+\.\d+\.\d+\/.+\.exe$/,
    );
    const href = await download.getAttribute('href');
    const fileName = href?.split('/').pop() ?? '';
    expect(fileName.endsWith('.exe')).toBeTruthy();
    await expect(page.getByText(fileName)).toBeVisible();

    await expect(page.getByRole('link', { name: /Source code \(MIT\)/ })).toHaveAttribute(
      'href',
      'https://github.com/termainejenkins/TimeKeeper',
    );
    await expect(page.getByRole('link', { name: /All releases and checksums/ })).toHaveAttribute(
      'href',
      'https://github.com/termainejenkins/TimeKeeper/releases/latest',
    );
  });
});

test.describe('AutoNote', () => {
  test('describes the unpublished Chrome extension and has no installer', async ({ page }) => {
    await openHtml(page, '/products/autonote/');
    await expect(page.locator('h1')).toHaveText('AutoNote');
    await expect(page.getByText(/Chrome extension/i)).toBeVisible();
    await expect(page.getByText(/in development, not yet released/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Ask about AutoNote/ })).toHaveAttribute('href', '/contact/');

    const hrefs = await page.locator('a').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href') ?? ''),
    );
    expect(hrefs.filter((href) => href.includes('/releases/'))).toEqual([]);
  });
});

test.describe('SS Game Launcher', () => {
  test('renders the Windows download and says it does not install the game', async ({ page }) => {
    await openHtml(page, '/games/launcher/');
    await expect(page.locator('h1')).toHaveText('SS Game Launcher');
    await expect(page.getByText(/does not download or install the game/i).first()).toBeVisible();
    await expect(page.getByText(/Steam \(app 1751950\)/).first()).toBeVisible();
    await expect(page.getByText('SHA-256', { exact: true })).toBeVisible();

    const download = page.getByRole('link', { name: 'Download SS Game Launcher for Windows' });
    await expect(download).toHaveAttribute(
      'href',
      /https:\/\/github\.com\/termainejenkins\/SS_GameLauncher\/releases\/download\/v\d+\.\d+\.\d+\/.+\.exe$/,
    );
    const href = await download.getAttribute('href');
    const fileName = href?.split('/').pop() ?? '';
    expect(fileName.endsWith('.exe')).toBeTruthy();
    await expect(page.getByText(fileName)).toBeVisible();

    // The pinned installer is allowed to be older than GitHub's latest tag.
    // This test checks that the page shows the file it links to. See known-issues.md.
    await expect(page.getByRole('link', { name: /All releases and checksums/ })).toHaveAttribute(
      'href',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/latest',
    );
  });
});
