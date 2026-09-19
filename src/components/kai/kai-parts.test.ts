import { describe, expect, it } from "vitest";
import { groupConversations, parseAnswer } from "./kai-parts";

describe("parseAnswer", () => {
  it("turns Kai sections into headings and bullets", () => {
    const blocks = parseAnswer("Vos tarifs\n• À vérifier : Team 29 $\n• Business 99 $\n\nQuel point souhaitez-vous approfondir ?");
    expect(blocks).toEqual([
      { kind: "heading", text: "Vos tarifs" },
      { kind: "bullet", text: "Team 29 $", unverified: true },
      { kind: "bullet", text: "Business 99 $", unverified: false },
      { kind: "text", text: "Quel point souhaitez-vous approfondir ?", unverified: false },
    ]);
  });

  it("keeps detail lines with their bullet", () => {
    const blocks = parseAnswer("Your target customers\n• Backend engineers — own jobs\nPain points : alerts\n\nMore?");
    expect(blocks[1]).toEqual({ kind: "bullet", text: "Backend engineers — own jobs\nPain points : alerts", unverified: false });
    expect(blocks[2]).toMatchObject({ kind: "text", text: "More?" });
  });
});

describe("groupConversations", () => {
  it("buckets by recency and drops empty groups", () => {
    const now = new Date("2026-09-19T12:00:00");
    const labels = { today: "Today", yesterday: "Yesterday", week: "Week", older: "Older" };
    const groups = groupConversations(
      [{ updatedAt: "2026-09-19T08:00:00" }, { updatedAt: "2026-09-18T20:00:00" }, { updatedAt: "2026-08-01T10:00:00" }],
      labels,
      now,
    );
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([["Today", 1], ["Yesterday", 1], ["Older", 1]]);
  });
});
