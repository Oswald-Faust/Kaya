import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/** Password hashing with scrypt (N=2^15, r=8, p=1). Format: scrypt$N$r$p$salt$hash (base64url). */
const N = 32768;
const R = 8;
const P = 1;
const KEYLEN = 64;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEYLEN, { ...options, maxmem: 128 * N * (options.r ?? R) * 2 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64url");
  const actual = await derive(password, Buffer.from(saltB64, "base64url"), { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A valid hash of a random secret, verified when an email is unknown so response time doesn't reveal accounts. */
let dummy: Promise<string> | null = null;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(12).toString("hex"));
  return dummy;
}
