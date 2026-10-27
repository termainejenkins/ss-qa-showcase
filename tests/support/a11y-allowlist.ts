/**
 * Serious and critical axe violations that already exist on the live site.
 *
 * The accessibility test still runs those rules. An entry accepts one rule on
 * one path so a new violation still fails. Each entry needs a reason.
 * Remove an entry when the site is fixed: the test fails if an entry matches
 * nothing (a stale allowlist).
 *
 * Moderate and minor violations are warnings on the Playwright report. They
 * do not belong in this list.
 */
export type A11yAllowlistEntry = {
  /** axe rule id, for example "color-contrast". */
  id: string;
  /** Pathname of the page, for example "/about/". */
  path: string;
  /**
   * When set, at least one axe target must contain this string.
   * Omit only when every target of this rule on this path is accepted.
   */
  targetIncludes?: string;
  /** Why this violation is accepted. Required. */
  reason: string;
};

const steamWidget =
  'Inside the Steam store widget iframe (store.steampowered.com), which this site does not author. The iframe element itself has a title. A site-owned image or link, whose axe target does not include the iframe, still fails.';

export const a11yAllowlist: A11yAllowlistEntry[] = [
  {
    id: 'color-contrast',
    path: '/',
    targetIncludes: '.home-offer > .card-tag',
    reason:
      'Home "Services" tag is #c98c33 on #3f362a, 11px, contrast 4.1:1. WCAG AA for that size is 4.5:1. Measured 2026-10-27. Accepted until the site changes that chip color.',
  },
  {
    id: 'image-alt',
    path: '/',
    targetIncludes: 'iframe',
    reason: `Steam widget capsule image has no alt. ${steamWidget}`,
  },
  {
    id: 'link-name',
    path: '/',
    targetIncludes: 'iframe',
    reason: `Steam widget wraps the capsule image in a link with no accessible name. ${steamWidget}`,
  },
  {
    id: 'image-alt',
    path: '/games/the-great-circle/',
    targetIncludes: 'iframe',
    reason: `Same Steam widget capsule image as the home page. ${steamWidget}`,
  },
  {
    id: 'link-name',
    path: '/games/the-great-circle/',
    targetIncludes: 'iframe',
    reason: `Same Steam widget link as the home page. ${steamWidget}`,
  },
];
