# Known issues

Observed against `https://sentientsolutions-site.pages.dev` on 2026-10-27. These are properties of the live site. Tests stay strict. An accessibility exception belongs in `tests/support/a11y-allowlist.ts` with a reason. Other findings stay documented here, and the assertion that caught them stays in place.

## SS Game Launcher pins an older installer than GitHub latest

The launcher page links `SS_GameLauncher-Setup-1.0.1.exe` under `/releases/download/v1.0.1/`. On 2026-10-27, `https://github.com/termainejenkins/SS_GameLauncher/releases/latest` redirected to tag `v1.1.5`.

The v1.0.1 asset still answers 302, then 200. The download test checks that the linked URL resolves. It does not fail when the pin is older than the latest tag. Version skew is a content issue on the site, not a broken link.

Time Keeper's pin on the same date was `v1.0.4`, and GitHub latest for that repo was also `v1.0.4`.

## Not-found template drops the trailing slash

Content routes use `trailingSlash: 'always'`: `/about` returns 308 to `/about/`. The not-found template is the exception.

- An unknown path such as `/this-page-is-not-on-the-site/` returns **404** and the "Page not found" page. Its canonical is `https://sentientsolutions-site.pages.dev/404/`.
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
