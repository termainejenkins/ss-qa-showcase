import { test, expect } from './support/fixtures';
import { fetchReadOnly, probeStatus } from './support/http';
import { HTML_ROUTES } from './support/routes';
import { originFrom } from './support/site';
import { extractAnchorHrefs, isGithubReleaseUrl, resolveHttpUrl, urlForLog } from './support/urls';

test('GitHub release links resolve to 200 without downloading installers', async ({ request }, testInfo) => {
  test.setTimeout(180_000);
  const origin = originFrom(testInfo.project.use.baseURL as string | undefined);
  const links = new Set<string>();

  for (const route of HTML_ROUTES) {
    const pageUrl = new URL(route.path, origin).href;
    const response = await fetchReadOnly(request, 'GET', pageUrl);
    expect(response.status(), pageUrl).toBe(200);
    for (const href of extractAnchorHrefs(await response.text())) {
      const url = resolveHttpUrl(href, pageUrl);
      if (url && isGithubReleaseUrl(url)) links.add(url.href);
    }
  }

  const sorted = [...links].sort();
  console.log(`release links checked:\n${sorted.join('\n')}`);
  expect(sorted.length, 'expected release links on the public site').toBeGreaterThan(0);
  expect(sorted.some((url) => url.includes('/SS_GameLauncher/releases/'))).toBeTruthy();
  expect(sorted.some((url) => url.includes('/TimeKeeper/releases/download/'))).toBeTruthy();

  const failures: string[] = [];
  for (const url of sorted) {
    const probe = await probeStatus(request, url);
    const ok = probe.status === 200 || probe.status === 206;
    if (!ok) failures.push(`${probe.method} ${probe.status} ${urlForLog(url)}`);
  }
  expect(failures, failures.join('\n')).toEqual([]);
});
