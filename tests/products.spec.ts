import { test, expect } from './support/fixtures';
import { openHtml } from './support/page-health';

/** GitHub's moving latest URL, or a pinned vX.Y.Z tag, on SS_GameLauncher only. */
const LAUNCHER_RELEASES_HREF =
  /^https:\/\/github\.com\/termainejenkins\/SS_GameLauncher\/releases\/(?:latest|tag\/v\d+\.\d+\.\d+)$/;

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
      LAUNCHER_RELEASES_HREF,
    );
  });

  test('all-releases link is latest or a pinned semver tag on this repo', () => {
    const accepted = [
      'https://github.com/termainejenkins/SS_GameLauncher/releases/latest',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/tag/v1.2.0',
    ];
    const rejected = [
      'https://github.com/termainejenkins/SS_GameLauncher/releases',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/latest/',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/tag/v1.2',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/tag/v1.2.0/',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/tag/v1.2.0-beta.1',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/download/v1.2.0/SS_GameLauncher-Setup-1.2.0.exe',
      'https://github.com/termainejenkins/TimeKeeper/releases/latest',
      'https://github.com/termainejenkins/TimeKeeper/releases/tag/v1.2.0',
      'https://github.com/other/SS_GameLauncher/releases/tag/v1.2.0',
      'https://github.com/termainejenkins/SS_GameLauncher/releases/tag/v1.2.0?ref=site',
    ];
    for (const href of accepted) expect(href, href).toMatch(LAUNCHER_RELEASES_HREF);
    for (const href of rejected) expect(href, href).not.toMatch(LAUNCHER_RELEASES_HREF);
  });
});
