import { isIP } from "node:net";
import { DomainError } from "@/server/domain/errors";

/**
 * Crawled URLs come from users; the crawler runs on our servers. Everything
 * here exists to stop the crawler being pointed at internal infrastructure
 * (SSRF): scheme, credentials, ports, internal hostnames and private IPs.
 * DNS resolution is re-checked on every request hop in the crawler.
 */

const INTERNAL_SUFFIX = /(^|\.)(localhost|local|localdomain|internal|intranet|lan|home|corp|test|invalid|example)$/;

export function normalizeProductUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new DomainError("validation", "Enter your product's website address.");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new DomainError("validation", "That doesn't look like a website address.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new DomainError("unsafe_url", "Only http and https websites can be analyzed.");
  }
  if (url.username || url.password) {
    throw new DomainError("unsafe_url", "Remove the username or password from the address.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new DomainError("unsafe_url", "Use the public website address, without a custom port.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const bare = host.replace(/^\[|\]$/g, "");
  if (isIP(bare)) {
    if (isPrivateAddress(bare)) throw new DomainError("unsafe_url", "Private and local network addresses can't be analyzed.");
  } else if (!host.includes(".") || INTERNAL_SUFFIX.test(host)) {
    throw new DomainError("unsafe_url", "Use your product's public website address.");
  }

  url.hash = "";
  return url;
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (version === 6) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    const dotted = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isPrivateAddress(dotted[1]);
    const hex = v.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith("ff");
  }
  return true;
}
