# ss-qa-showcase

[![CI](https://github.com/termainejenkins/ss-qa-showcase/actions/workflows/ci.yml/badge.svg)](https://github.com/termainejenkins/ss-qa-showcase/actions/workflows/ci.yml)

Read-only Playwright checks for the public Sentient Solutions website. The suite is tested in CI against the live static site. It is a hiring-portfolio project, not a production monitoring system.

These tests were written with AI assistance, directed and reviewed by the author (TJ).

The site is an Astro static site. CI uses `https://sentientsolutions-site.pages.dev`. The same site is also reachable at `https://sentientsolutions.dev`. Canonical URLs point at the pages.dev origin.

## Run

Node.js 22 or newer.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

The HTML report is written to `playwright-report/`. Open it with `npm run report`.

Override the origin with `SITE_URL` (origin only; no token, no path):

```bash
SITE_URL=https://sentientsolutions-site.pages.dev npm test
```

No repo secrets, tokens, or accounts are required. Do not add any.

## What is covered

Chromium only. Tests live in `tests/`.

| Area | What it checks |
| --- | --- |
| Smoke | Every main route returns 200, has a non-empty title containing "Sentient Solutions", and has one expected `<h1>`. No console errors. No failed same-origin requests. `/rss.xml`, `/sitemap.xml`, and `/robots.txt` return 200. |
| Navigation | Header links (Games, Products, Services, Work, About, Contact) and the logo reach the right pages. Footer internal links are the expected set and each one opens. |
| Products | Time Keeper, AutoNote, and SS Game Launcher render their current key content, including the Windows download links where a download exists. |
| Downloads | Every `github.com/termainejenkins/<repo>/releases/...` link on the site resolves to 200 through redirects. Installers are not downloaded. |
| Links | Same-origin links from the sitemap and from page `<a>` tags return 200. External links are checked with HEAD. |
| Accessibility | axe-core on each main page. Serious and critical violations fail. Other impacts are warnings on the report. |
| 404 | An unknown route returns the not-found page, status 404, with a link back home. |
| SEO | Canonical URL, meta description, trailing-slash redirects, `robots.txt`, `sitemap.xml` (structure and every URL loads), and a basic RSS 2.0 channel check. |

Expected headings and the footer contract are in `tests/support/routes.ts`.

## Design notes

**Read-only on purpose.** This suite runs from GitHub Actions on every pull request, on pushes to `main`, and every day at 06:17 UTC. Anyone can clone the repo and run it. A write would hit the live public site: a contact form, a support ticket, a newsletter signup. The contact form is not on the site today ("coming soon"), and this suite must not be what submits it if it appears.

The page fixture fails a test when the site origin, or any `workers.dev` host, sees a method other than GET or HEAD, or when a request targets same-origin `/api/` or a Worker host. Link and download checks go through `tests/support/http.ts`, which only issues GET and HEAD. Forms are never submitted.

**Installers are not downloaded.** Release assets are checked with HEAD, following redirects (GitHub answers 302, then 200). If a host rejects HEAD, the helper sends a one-byte ranged GET and fails if the body is larger than 4 KB. GitHub 429 and 5xx responses are retried once.

**External 403, 429, and 999 are skips.** Discord, Steam, social hosts, and similar sites often refuse automated clients. Those statuses are annotated on the report as warnings. A 404 still fails. Same-origin links have no skip list.

**Accessibility allowlist.** Serious and critical axe failures fail the run. If one already exists on the site, it is recorded in `tests/support/a11y-allowlist.ts` with a reason instead of turning the rule off. A stale entry fails too. See `known-issues.md`.

**Chromium only, one retry in CI.** `trace` is `on-first-retry`. Reporters are `list` and `html`. Local runs do not retry, so a failure shows up on the first attempt. CI uses two workers so the live site is not hit with a large parallel burst.

**Lighthouse CI is not part of this suite.** `@lhci/cli` was left out. The pages embed a Steam widget and other third-party frames, and a score against the live origin moves around with network conditions on GitHub-hosted runners. A flaky performance gate would not be an honest signal. The README says that directly rather than shipping a check that is ignored when it fails.

## Known site issues

See [known-issues.md](known-issues.md). In short, on 2026-10-27:

- The launcher page pins installer **v1.0.1** while GitHub's latest tag is **v1.1.5**. The pinned file still resolves. That is not a test failure.
- `/404/` redirects to `/404`, which is the one break in `trailingSlash: 'always'`. Unknown URLs still return the 404 page.
- The home page "Services" tag contrast is 4.1:1 (AA wants 4.5:1 at that size). The Steam widget iframe on the home page and The Great Circle page has an image without alt text and a link without an accessible name. Those are allowlisted with reasons. A new serious or critical violation still fails.

## CI and the HTML report

Workflow: `.github/workflows/ci.yml`.

- Triggers: push to `main`, pull requests, schedule `17 6 * * *`, and `workflow_dispatch`.
- `ubuntu-latest`, Node 22, npm cache, `npx playwright install --with-deps chromium`.
- The `playwright-report` artifact is uploaded from the test job (`contents: read` at the workflow level).
- A second job publishes that report with `actions/upload-pages-artifact` and `actions/deploy-pages`. It runs on `main` (push, schedule, or manual dispatch), not on pull requests. Its permissions are `pages: write`, `id-token: write`, plus `contents: read` and `actions: read` so it can download the report artifact.

After this is merged, enable Pages or the deploy job has nowhere to publish: **Settings → Pages → Source: GitHub Actions**. Until that is on, the deploy job is `continue-on-error` so a missing Pages environment does not fail CI. The test job still fails when tests fail. The public report URL, once Pages is enabled, is the project Pages site (typically `https://termainejenkins.github.io/ss-qa-showcase/`).

## Limitations

- Tested in CI against the public site. Not production-grade monitoring, not an uptime guarantee, and not a visual-regression suite.
- Desktop Chromium and the default dark theme only. The light theme and the collapsed mobile nav are not separate scans.
- No authenticated flows, and no accounts to authenticate with.
- A third party that returns 403 for a genuinely removed URL is counted as a skip. The annotation lists those URLs.
- Canonical assertions expect the `SITE_URL` origin. The published canonical host is `sentientsolutions-site.pages.dev`, so that is the origin CI sets. Pointing `SITE_URL` at `https://sentientsolutions.dev` fails the canonical check because the site still canonicalizes to pages.dev.
- AutoNote is covered as an unpublished Chrome extension. A real release should update that test, not the allowlist.
- The Pages report is the static Playwright HTML report. Trace viewing is more reliable locally via `npm run report` than on GitHub Pages.
