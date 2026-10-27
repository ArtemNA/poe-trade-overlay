import { afterEach, describe, expect, it } from 'vitest';
import { CLOUDFLARE_CHECK_ERROR, USER_AGENT } from '../src/app/constants';
import { isCloudflareCheck, poeFetch, setHttpFetch } from '../src/app/core/http';

const challenge = () =>
  new Response('<html>Just a moment...</html>', { status: 403, headers: { 'content-type': 'text/html; charset=UTF-8', 'cf-mitigated': 'challenge' } });

describe('poe fetch', () => {
  afterEach(() => setHttpFetch(globalThis.fetch));

  it('recognises the Cloudflare check', () => {
    expect(isCloudflareCheck(challenge())).toBe(true);
    expect(isCloudflareCheck(new Response('<html></html>', { status: 503, headers: { 'content-type': 'text/html' } }))).toBe(true);
    expect(isCloudflareCheck(new Response('{"error":{}}', { status: 400, headers: { 'content-type': 'application/json' } }))).toBe(false);
  });

  it('turns a Cloudflare check on pathofexile.com into a clear error, sends our User-Agent', async () => {
    let userAgent: string | null = null;
    setHttpFetch(async (_, init) => {
      userAgent = new Headers(init?.headers).get('User-Agent');
      return challenge();
    });
    await expect(poeFetch('https://www.pathofexile.com/api/trade/search/Standard')).rejects.toThrow(CLOUDFLARE_CHECK_ERROR);
    expect(userAgent).toBe(USER_AGENT);
    // Other sites keep their own answer.
    await expect(poeFetch('https://poe.ninja/api/data/x')).resolves.toBeInstanceOf(Response);
  });
});
