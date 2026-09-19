import { describe, expect, it } from "vitest";
import { replyFromMemory } from "./kai-engine";
import { filterRelevantMemory, type WorkspaceMemory } from "./kai";

const mockMemory: WorkspaceMemory = {
  product: {
    name: "StableVPS",
    url: "https://stablevps.io",
    domain: "stablevps.io",
    oneLiner: "Ultra-low-latency VPS for algorithmic traders",
    category: "Cloud Hosting",
  },
  brand: {
    voiceSummary: "Direct, technical, performance-first",
    traits: ["reliable", "ultra-low-latency", "transparent"],
    wordsToUse: ["sub-millisecond", "dedicated NVMe"],
    wordsToAvoid: ["cheap", "unlimited"],
  },
  facts: [
    {
      id: "f1",
      key: "pricing.plan.starter",
      category: "pricing",
      statement: "Starter plan is $19/month with 1Gbps uplink.",
      kind: "verified",
      status: "confirmed",
      confidence: 0.95,
      evidence: "$19/month",
    },
    {
      id: "f2",
      key: "audience.primary",
      category: "audience",
      statement: "Algorithmic and high-frequency traders needing proximity to exchanges.",
      kind: "verified",
      status: "confirmed",
      confidence: 0.9,
      evidence: "Forex and crypto automated trading",
    },
  ],
  icps: [
    {
      id: "icp1",
      name: "Algorithmic Traders",
      description: "Individual traders running MetaTrader 4/5 or Python trading bots.",
      pains: ["Slippage on trades", "VPS downtime during market open"],
      triggers: ["Missed a trade due to high latency"],
      objections: ["Is your network truly closer to Equinix LD4?"],
      whereTheyAre: ["ForexFactory", "TradingView forums"],
      priority: 1,
    },
  ],
  personas: [
    {
      id: "per1",
      name: "Quant Trader",
      role: "Solo Trader / Engineer",
      jobs: ["Automate trading strategies", "Monitor execution latency"],
    },
  ],
  competitors: [
    {
      id: "cmp1",
      name: "ForexVPS.net",
      url: "https://forexvps.net",
      kind: "direct",
      positioning: "Established Forex VPS provider",
      pricingSummary: "Starts at $34/mo",
      wedge: "We offer NVMe gen4 and sub-0.5ms latency at half their price.",
      confidence: 0.85,
    },
  ],
  learnings: [
    {
      id: "lrn1",
      kind: "winner",
      statement: "Comparative landing page against ForexVPS.net increased signup rate by 34%.",
      confidence: 0.92,
      impact: "high",
      metricLabel: "+34% signup rate",
    },
  ],
  strategy: {
    version: 1,
    summary: "Scale from $200 to $1k MRR via high-intent SEO and comparative pages.",
    pillars: ["Latency comparison pages", "Forex community sponsorships"],
  },
  goal: {
    title: "Reach $1k MRR",
    targetValue: 1000,
    baselineValue: 200,
    unit: "usd",
  },
  experiments: [
    {
      id: "exp1",
      number: 11,
      name: "Page comparative alternative à ForexVPS.net",
      status: "running",
      channel: "seo_content",
      hypothesis: "Comparative page converts visitors looking for ForexVPS alternatives.",
    },
  ],
};

describe("Kai RAG memory filtering", () => {
  it("filters facts and builds sources based on pricing query", () => {
    const { contextText, sources } = filterRelevantMemory(mockMemory, "Quel est notre pricing et nos tarifs ?");
    expect(sources.some((s) => s.type === "fact" && s.label === "pricing.plan.starter")).toBe(true);
    expect(contextText).toContain("PRODUCT: StableVPS");
    expect(contextText).toContain("Starter plan is $19/month");
  });

  it("retrieves ICP and pain points for audience queries", () => {
    const { sources, contextText } = filterRelevantMemory(mockMemory, "Qui est notre client cible ou persona ?");
    expect(sources.some((s) => s.type === "icp" && s.label === "Algorithmic Traders")).toBe(true);
    expect(contextText).toContain("Algorithmic Traders");
    expect(contextText).toContain("Slippage on trades");
  });

  it("includes competitor wedge and positioning for competitor questions", () => {
    const { sources, contextText } = filterRelevantMemory(mockMemory, "Que sait-on de ForexVPS.net et notre différenciation ?");
    expect(sources.some((s) => s.type === "competitor" && s.label === "ForexVPS.net")).toBe(true);
    expect(contextText).toContain("Wedge: We offer NVMe gen4");
  });

  it("includes validated learnings from previous experiments", () => {
    const { sources, contextText } = filterRelevantMemory(mockMemory, "Qu'avons-nous appris de nos expériences passées ?");
    expect(sources.some((s) => s.type === "learning")).toBe(true);
    expect(contextText).toContain("Comparative landing page against ForexVPS.net");
  });
});


describe("Kai internal dialogue engine", () => {
  it("answers several intents and cites only the records used", () => {
    const answer = replyFromMemory(mockMemory, "Compare our pricing with competitors", [], "en");
    expect(answer.reply).toContain("$19/month");
    expect(answer.reply).toContain("$34/mo");
    expect(answer.sources.map(source => source.type)).toEqual(["fact", "competitor"]);
  });
  it("resolves a follow-up from the previous user topic", () => {
    const answer = replyFromMemory(mockMemory, "Et plus de détails ?", [{ role: "user", content: "Qui est notre client cible ?" }], "fr");
    expect(answer.reply).toContain("Algorithmic Traders");
    expect(answer.reply).toContain("Déclencheurs");
    expect(answer.sources.every(source => source.type === "icp")).toBe(true);
  });
  it("does not misclassify a strategy plan as pricing", () => {
    const answer = replyFromMemory(mockMemory, "What is our plan?", [], "en");
    expect(answer.reply).toContain("Your current strategy");
    expect(answer.sources.some(source => source.type === "fact")).toBe(false);
  });
  it("does not invent a reason for a metric change", () => {
    const answer = replyFromMemory(mockMemory, "Why did signups change this week?", [], "en");
    expect(answer.reply).toContain("cannot explain a change");
    expect(answer.reply).not.toContain("+34%");
  });
  it("makes missing pricing and uncertainty explicit", () => {
    const empty = replyFromMemory({ ...mockMemory, facts: [] }, "Nos prix ?", [], "fr");
    expect(empty.reply).toContain("pas encore enregistrée");
    const uncertain = replyFromMemory({ ...mockMemory, facts: mockMemory.facts.map(f => ({ ...f, status: "proposed" })) }, "pricing", [], "en");
    expect(uncertain.reply).toContain("Unverified:");
  });
  it("asks for clarification rather than returning unrelated facts", () => {
    const answer = replyFromMemory(mockMemory, "Can you tell me the weather?", [], "en");
    expect(answer.reply).toContain("Clarify the topic");
    expect(answer.sources).toEqual([]);
  });
  it("keeps English labels in English", () => {
    const answer = replyFromMemory(mockMemory, "Who are our customers?", [], "en");
    expect(answer.reply).toContain("Pain points");
    expect(answer.reply).not.toContain("Douleurs");
  });
  it("retrieves a named competitor without an explicit intent keyword", () => {
    expect(replyFromMemory(mockMemory, "Tell me about ForexVPS.net", [], "en").reply).toContain("Starts at $34/mo");
  });
});

describe("Kai conversation management", () => {
  it("exports conversation lifecycle functions for delete, archive, unarchive, and model updates", async () => {
    const kai = await import("./kai");
    expect(typeof kai.deleteKaiConversation).toBe("function");
    expect(typeof kai.archiveKaiConversation).toBe("function");
    expect(typeof kai.unarchiveKaiConversation).toBe("function");
    expect(typeof kai.updateKaiConversationModel).toBe("function");
    expect(typeof kai.listKaiConversations).toBe("function");
  });
});

