import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { open, parseKey, seal, signToken, verifyToken } from "./crypto";

const key = parseKey(randomBytes(32).toString("base64"));

describe("integration vault crypto", () => {
  it("round-trips a secret", () => {
    const sealed = seal('{"apiKey":"rk_test_123"}', key, "ws_1");
    expect(sealed.ciphertext).not.toContain("rk_test");
    expect(open(sealed, key, "ws_1")).toBe('{"apiKey":"rk_test_123"}');
  });

  it("refuses to open a secret in another workspace or with a tampered tag", () => {
    const sealed = seal("secret", key, "ws_1");
    expect(() => open(sealed, key, "ws_2")).toThrow();
    const tag = Buffer.from(sealed.tag, "base64");
    tag[0] ^= 1;
    expect(() => open({ ...sealed, tag: tag.toString("base64") }, key, "ws_1")).toThrow();
  });

  it("rejects keys that aren't 32 bytes", () => {
    expect(() => parseKey(randomBytes(16).toString("base64"))).toThrow();
  });

  it("signs and verifies state tokens, rejecting tampering", () => {
    const token = signToken({ provider: "google_analytics", nonce: "abc" }, key);
    expect(verifyToken<{ provider: string }>(token, key)?.provider).toBe("google_analytics");
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ provider: "meta_ads", nonce: "abc" })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, key)).toBeNull();
    expect(verifyToken(`${body}.x`, key)).toBeNull();
  });
});
