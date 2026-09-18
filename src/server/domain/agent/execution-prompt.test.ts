import { describe, expect, it } from "vitest";
import { buildExecutionPrompt } from "./execution-prompt";

describe("coding-agent hand-off prompt", () => {
  it("turns a landing-page draft into an actionable, safe prompt", () => {
    const prompt = buildExecutionPrompt({
      locale: "en",
      goal: "Run EXP-011 comparison page",
      status: "awaiting_approval",
      summary: "Draft created; publishing is waiting for approval.",
      plan: { objective: "Prepare the page", assumptions: [], steps: [{ id: "draft", title: "Draft the page", why: "Create the deliverable", tool: "content.draft_asset", risk: "R1" }] },
      assets: [{ title: "Comparison page", kind: "landing_page", channel: "seo_pages", status: "draft", body: "# Compare products" }],
      approvals: [{ title: "Publish landing page", change: "Draft → live", tool: "pages.publish", status: "pending", input: { path: "/compare/products" } }],
    });

    expect(prompt).toContain("TARGET URL OR ROUTE: /compare/products");
    expect(prompt).toContain("Create this page in the existing site");
    expect(prompt).toContain("--- BEGIN KAYA DRAFT ---");
    expect(prompt).toContain("# Compare products");
    expect(prompt).toContain("stop before any deployment, publication, email send, or spend");
  });

  it("also produces a useful prompt when no asset was created", () => {
    const prompt = buildExecutionPrompt({ locale: "fr", goal: "Diagnostiquer les inscriptions", status: "completed", plan: null, assets: [], approvals: [], summary: null });
    expect(prompt).toContain("TÂCHE : Diagnostiquer les inscriptions");
    expect(prompt).toContain("Analyse la tâche ci-dessous");
    expect(prompt).toContain("RÈGLE DE SÉCURITÉ");
  });
});
