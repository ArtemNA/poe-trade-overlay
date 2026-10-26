import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { USER_AGENT } from '../constants';

type Fetch = typeof globalThis.fetch;

// Requests go through tauri-plugin-http (Rust side): no CORS, response headers such as
// X-Rate-Limit-* are readable. Tests swap in their own fetch.
let impl: Fetch = (input, init) => tauriFetch(input, init);

export function setHttpFetch(fetch: Fetch): void {
  impl = fetch;
}

/** fetch for PoE and related sites, always with our User-Agent. */
export function poeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('User-Agent', USER_AGENT);
  return impl(url, { ...init, headers });
}
