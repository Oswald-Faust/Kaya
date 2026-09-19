import { describe, expect, it } from "vitest";
import { isPageTourKey, pageTourKey } from "./page-tours";

describe("pageTourKey", () => {
  it("maps workspace routes to their tour", () => {
    expect(pageTourKey("/w/acme")).toBe("command");
    expect(pageTourKey("/w/acme/")).toBe("command");
    expect(pageTourKey("/w/acme/kai")).toBe("kai");
    expect(pageTourKey("/w/acme/agent")).toBe("agent");
    expect(pageTourKey("/w/acme/agent/run_123")).toBe("run");
    expect(pageTourKey("/w/acme/experiments")).toBe("experiments");
    expect(pageTourKey("/w/acme/experiments/12")).toBe("experiment");
    expect(pageTourKey("/w/acme/analytics?range=30")).toBe("analytics");
    expect(pageTourKey("/w/acme/settings/team")).toBe("settings");
  });

  it("ignores routes without a tour", () => {
    expect(pageTourKey("/")).toBeNull();
    expect(pageTourKey("/w")).toBeNull();
    expect(pageTourKey("/start/acme")).toBeNull();
    expect(pageTourKey("/w/acme/unknown")).toBeNull();
    expect(pageTourKey("/w/acme/learnings/extra")).toBeNull();
  });

  it("validates keys", () => {
    expect(isPageTourKey("strategy")).toBe(true);
    expect(isPageTourKey("admin")).toBe(false);
  });
});
