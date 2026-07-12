import 'server-only';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

/**
 * budget-guard SSRF defense (audit B8/B9). One choke point every user/content-supplied URL
 * fetch passes through: enforce http(s), resolve the hostname, and reject any address in a
 * private / loopback / link-local / cloud-metadata range. Callers should fetch with
 * redirect:'manual' and re-assert each Location hop (safeFetch does this) so a public URL
 * cannot 302 into the internal network.
 */

/** Returns true if an IP literal falls in a blocked (non-public) range. */
export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10/8 private
    if (a === 127) return true; // 127/8 loopback
    if (a === 169 && b === 254) return true; // 169.254/16 link-local incl. 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12 private
    if (a === 192 && b === 168) return true; // 192.168/16 private
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // loopback / unspecified
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7 ULA
    if (lower.startsWith('fe80')) return true; // link-local
    // IPv4-mapped (::ffff:a.b.c.d) — re-check the embedded v4
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIp(mapped[1]);
    return false;
  }
  return true; // not a valid IP literal → treat as blocked (fail closed)
}

/**
 * Validate a user/content-supplied URL: http(s) only, hostname must resolve to a public
 * address. Throws on any violation. Returns the parsed URL for the caller to fetch.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SSRF_BLOCKED: invalid URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`SSRF_BLOCKED: only http(s) allowed`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  // If the host is an IP literal, check it directly (also catches decimal/hex-encoded via URL parse).
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error(`SSRF_BLOCKED: non-public address`);
    return url;
  }

  // Otherwise resolve and reject if ANY resolved address is non-public (mitigates DNS rebinding
  // at request time; a rebind between this check and the fetch is the documented residual).
  let addrs: Array<{ address: string }>;
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new Error(`SSRF_BLOCKED: DNS resolution failed`);
  }
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
    throw new Error(`SSRF_BLOCKED: non-public address`);
  }
  return url;
}

/**
 * fetch() wrapper that validates the URL, follows redirects manually, and re-asserts each
 * hop's target so a public URL cannot redirect into the internal network. Caps hops at 5.
 */
export async function safeFetch(raw: string, init?: RequestInit): Promise<Response> {
  let current = (await assertPublicUrl(raw)).toString();
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return res;
      current = (await assertPublicUrl(new URL(location, current).toString())).toString();
      continue;
    }
    return res;
  }
  throw new Error(`SSRF_BLOCKED: too many redirects`);
}
