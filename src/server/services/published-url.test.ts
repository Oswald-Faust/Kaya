import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkUrlReachability } from "./experiments";

describe("checkUrlReachability", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects invalid URLs", async () => {
    const resEn = await checkUrlReachability("not-a-url");
    expect(resEn.ok).toBe(false);
    expect(resEn.error).toBe("Invalid URL format.");

    const resFr = await checkUrlReachability("not-a-url", "fr");
    expect(resFr.ok).toBe(false);
    expect(resFr.error).toBe("Format d'URL invalide.");
  });

  it("rejects non-http(s) protocols", async () => {
    const resEn = await checkUrlReachability("ftp://example.com/page");
    expect(resEn.ok).toBe(false);
    expect(resEn.error).toBe("The URL must begin with http:// or https://");

    const resFr = await checkUrlReachability("ftp://example.com/page", "fr");
    expect(resFr.ok).toBe(false);
    expect(resFr.error).toBe("L'URL doit commencer par http:// ou https://");
  });

  it("succeeds when HEAD returns 200 OK", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const res = await checkUrlReachability("https://example.com/vs-competitor");
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
  });

  it("falls back to GET if HEAD fails", async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error("Method Not Allowed"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);
    global.fetch = mockFetch;

    const res = await checkUrlReachability("https://example.com/page");
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("fails when status is 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const res = await checkUrlReachability("https://example.com/missing-page");
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
    expect(res.error).toContain("404");
  });

  it("handles network errors gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ENOTFOUND"));

    const resEn = await checkUrlReachability("https://invalid-nonexistent-domain.xyz");
    expect(resEn.ok).toBe(false);
    expect(resEn.error).toContain("Unable to reach the server");

    const resFr = await checkUrlReachability("https://invalid-nonexistent-domain.xyz", "fr");
    expect(resFr.ok).toBe(false);
    expect(resFr.error).toContain("Impossible de joindre le serveur");
  });
});
