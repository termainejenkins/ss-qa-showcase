# Known issues

Observed against `https://sentientsolutions-site.pages.dev` on 2026-10-27. These are properties of the live site. Tests stay strict. An accessibility exception belongs in `tests/support/a11y-allowlist.ts` with a reason. Other findings stay documented here, and the assertion that caught them stays in place.

## SS Game Launcher installer pin

The launcher download test accepts any `vX.Y.Z` `.exe` under `SS_GameLauncher` `/releases/download/`. It checks that the linked URL resolves. It does not fail when that pin is older than GitHub latest. Version skew is a content issue on the site, not a broken link.

On 2026-10-27 the page linked `SS_GameLauncher-Setup-1.0.1.exe` and `releases/latest` redirected to `v1.1.5`. On 2026-11-23 the page linked `SS_GameLauncher-Setup-1.2.0.exe` and `releases/latest` redirected to `v1.2.0`. Time Keeper still linked `v1.0.4`, which matched GitHub latest on 2026-10-27.

## Not-found template drops the trailing slash

Content routes use `trailingSlash: 'always'`: `/about` returns 308 to `/about/`. The not-found template is the exception.

- An unknown path such as `/this-page-is-not-on-the-site/` returns **404** and the "Page not found" page. Its canonical is `https://sentientsolutions.dev/404/`. On 2026-10-27 that canonical used the pages.dev host. The site now publishes `sentientsolutions.dev` as the canonical host on both origins.
- Requesting `/404/` returns **308** to `/404` (no trailing slash).
- `/404` returns **200**.

The 404 test checks the unknown-route behavior. It does not treat the `/404` slash exception as the expected shape of every URL.

## Accessibility

Serious and critical findings below are accepted in `tests/support/a11y-allowlist.ts`. The rules stay enabled. A new node on the same rule still fails, and a stale entry fails once the site (or Steam) fixes it.

Measured 2026-10-27, desktop Chromium, default dark theme, axe-core's default rule set.

- **Home, `color-contrast` (serious).** The "Services" tag (`.home-offer > .card-tag`) is `#c98c33` on `#3f362a` at 11px. Contrast is 4.1:1. The AA threshold at that size is 4.5:1.
- **Home and The Great Circle, `image-alt` (critical) and `link-name` (serious).** Both nodes are inside the Steam store widget iframe. The capsule image has no alt, and the link wrapped around it has no accessible name. The site's own `<iframe>` has a title. The widget document is Steam's.

Moderate and minor violations are warnings on the Playwright HTML report. They are not allowlisted and they do not fail CI. The 2026-10-27 local run reported none.

## Updating this file

When a test fails because the site is wrong, add the finding here and leave the assertion. Add an allowlist entry only for a serious or critical accessibility violation that is accepted for a stated reason. Delete the entry after the site is fixed. A stale entry fails the accessibility test.
