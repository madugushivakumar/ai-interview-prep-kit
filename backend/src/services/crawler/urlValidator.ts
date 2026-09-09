import dns from 'dns/promises';
import { URL } from 'url';

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/**
 * Validates and secures a URL against SSRF and unsupported protocols.
 */
export async function validateAndNormalizeUrl(
  rawUrl: string,
  allowLocal: boolean = false
): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  let parsed: URL;
  try {
    let urlToParse = rawUrl.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    parsed = new URL(urlToParse);
  } catch (err: any) {
    return { isValid: false, error: `Invalid URL format: ${err.message}` };
  }

  // Enforce http/https protocols only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: `Disallowed protocol: ${parsed.protocol}. Only http: and https: are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // If local testing is explicitly allowed (CLI evaluation / dev mode)
  if (allowLocal) {
    return { isValid: true, normalizedUrl: parsed.toString() };
  }

  // SSRF Protection for production: reject loopback, private ranges, metadata IPs
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (isLocalHost) {
    return { isValid: false, error: 'Localhost and loopback addresses are blocked in production for security.' };
  }

  // Resolve DNS to verify IP address ranges
  try {
    const lookup = await dns.lookup(hostname);
    const ip = lookup.address;

    if (isPrivateIp(ip)) {
      return { isValid: false, error: `Private IP addresses are blocked (${ip}).` };
    }
  } catch (dnsErr: any) {
    return { isValid: false, error: `DNS lookup failed for hostname ${hostname}: ${dnsErr.message}` };
  }

  return { isValid: true, normalizedUrl: parsed.toString() };
}

/**
 * Checks if an IP is in RFC 1918, RFC 6598 (CGNAT), RFC 3927 (link-local),
 * RFC 4193 (IPv6 ULA), RFC 4291 (IPv6 link-local), or cloud metadata ranges.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return true;

  const normalized = ip.trim().toLowerCase();

  // IPv4 / IPv6 Loopback and unspecified
  if (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    normalized === '::' ||
    normalized.startsWith('127.')
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const mappedIpv4 = normalized.substring(7);
    return isPrivateIp(mappedIpv4);
  }

  // IPv6 Unique Local Address (fc00::/7 -> fc00 to fdff)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // IPv6 Link-Local (fe80::/10 -> fe80 to febf)
  if (/^fe[89ab]/i.test(normalized)) {
    return true;
  }

  // RFC 1918: 10.0.0.0 - 10.255.255.255
  if (normalized.startsWith('10.')) return true;

  // RFC 1918: 172.16.0.0 - 172.31.255.255
  if (normalized.startsWith('172.')) {
    const parts = normalized.split('.');
    const second = parseInt(parts[1], 10);
    if (!isNaN(second) && second >= 16 && second <= 31) return true;
  }

  // RFC 1918: 192.168.0.0 - 192.168.255.255
  if (normalized.startsWith('192.168.')) return true;

  // RFC 3927: 169.254.0.0 - 169.254.255.255 (Link-local / Cloud metadata)
  if (normalized.startsWith('169.254.')) return true;

  // RFC 6598: Shared Address Space (CGNAT) 100.64.0.0 - 100.127.255.255
  if (normalized.startsWith('100.')) {
    const parts = normalized.split('.');
    const second = parseInt(parts[1], 10);
    if (!isNaN(second) && second >= 64 && second <= 127) return true;
  }

  return false;
}
