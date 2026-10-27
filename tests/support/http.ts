import type { APIRequestContext, APIResponse } from '@playwright/test';

/** Identifies this suite to hosts that reject an empty user agent. It carries no credentials. */
export const USER_AGENT = 'ss-qa-showcase/1.0 (read-only site checks)';

const TRANSIENT = new Set([429, 500, 502, 503, 504]);

export type Probe = {
  method: 'GET' | 'HEAD';
  status: number;
};

/**
 * GET or HEAD, following redirects. One retry on GitHub-style 429/5xx.
 * The method argument is the whole allowed set: there is no POST path here.
 */
export async function fetchReadOnly(
  request: APIRequestContext,
  method: 'GET' | 'HEAD',
  url: string,
  extraHeaders?: Record<string, string>,
): Promise<APIResponse> {
  const send = () =>
    request.fetch(url, {
      method,
      maxRedirects: 10,
      timeout: 30_000,
      failOnStatusCode: false,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
        ...extraHeaders,
      },
    });

  const first = await send();
  if (!TRANSIENT.has(first.status())) return first;
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  return send();
}

/**
 * Confirm a URL answers after redirects without downloading an installer.
 * HEAD is the normal path. A ranged GET is only used when the server rejects HEAD,
 * and a body larger than a few KB fails the check.
 */
export async function probeStatus(request: APIRequestContext, url: string): Promise<Probe> {
  const head = await fetchReadOnly(request, 'HEAD', url);
  if (head.status() !== 405 && head.status() !== 501) {
    return { method: 'HEAD', status: head.status() };
  }

  const ranged = await fetchReadOnly(request, 'GET', url, { Range: 'bytes=0-0' });
  const body = await ranged.body();
  if (body.byteLength > 4_096) {
    throw new Error(
      `Refusing ${url}: ranged GET returned ${body.byteLength} bytes. This check must not download an installer.`,
    );
  }
  return { method: 'GET', status: ranged.status() };
}
