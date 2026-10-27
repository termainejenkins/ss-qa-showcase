import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './support/fixtures';
import { a11yAllowlist, type A11yAllowlistEntry } from './support/a11y-allowlist';
import { openHtml } from './support/page-health';
import { HTML_ROUTES } from './support/routes';

type AxeViolation = {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  nodes: { target: unknown[] }[];
};

function nodeTargets(node: AxeViolation['nodes'][number]): string[] {
  return node.target.map((target) => String(target));
}

function matchingEntry(
  entries: A11yAllowlistEntry[],
  path: string,
  violation: AxeViolation,
  node: AxeViolation['nodes'][number],
): A11yAllowlistEntry | undefined {
  const rendered = nodeTargets(node);
  return entries.find((entry) => {
    if (entry.id !== violation.id || entry.path !== path) return false;
    if (!entry.targetIncludes) return true;
    return rendered.some((target) => target.includes(entry.targetIncludes as string));
  });
}

function formatViolation(path: string, violation: AxeViolation, nodes = violation.nodes): string {
  const where = nodes.flatMap((node) => nodeTargets(node)).slice(0, 8).join(', ') || '(no target)';
  return `${violation.id} (${violation.impact ?? 'unknown'}) on ${path}\n  ${where}\n  ${violation.help}\n  ${violation.helpUrl}`;
}

test.describe('accessibility', () => {
  test('allowlist entries name a route this suite opens', () => {
    const paths = new Set(HTML_ROUTES.map((route) => route.path));
    const unknown = a11yAllowlist.filter((entry) => !paths.has(entry.path));
    expect(unknown.map((entry) => `${entry.id} ${entry.path}`)).toEqual([]);
    for (const entry of a11yAllowlist) {
      expect(entry.reason.trim().length, entry.id).toBeGreaterThan(0);
    }
  });

  for (const route of HTML_ROUTES) {
    test(`${route.name} (${route.path}) has no new serious or critical violations`, async ({ page }, testInfo) => {
      await openHtml(page, route.path);
      const results = await new AxeBuilder({ page }).analyze();
      const entries = a11yAllowlist.filter((entry) => entry.path === route.path);
      const used = new Set<A11yAllowlistEntry>();
      const failures: string[] = [];
      const warnings: string[] = [];

      for (const violation of results.violations) {
        const impact = violation.impact ?? 'unknown';
        const blocking = impact === 'serious' || impact === 'critical';
        if (!blocking) {
          warnings.push(formatViolation(route.path, violation));
          continue;
        }
        // Allow one node at a time. A known iframe node must not hide a new
        // site-owned node on the same rule.
        const leftover = violation.nodes.filter((node) => {
          const entry = matchingEntry(entries, route.path, violation, node);
          if (entry) used.add(entry);
          return !entry;
        });
        if (leftover.length > 0) failures.push(formatViolation(route.path, violation, leftover));
      }

      const stale = entries.filter((entry) => !used.has(entry));
      expect(
        stale.map((entry) => `${entry.id} on ${entry.path} matched nothing (${entry.reason})`),
        'stale accessibility allowlist entry',
      ).toEqual([]);

      if (warnings.length > 0) {
        const body = warnings.join('\n\n');
        await testInfo.attach('axe-warnings.txt', {
          body: Buffer.from(body, 'utf8'),
          contentType: 'text/plain',
        });
        testInfo.annotations.push({
          type: 'warning',
          description: `${warnings.length} axe warning(s) (moderate, minor, or unset). They do not fail this test.\n${body.slice(0, 1_500)}`,
        });
      }

      expect(failures, failures.join('\n\n')).toEqual([]);
    });
  }
});
