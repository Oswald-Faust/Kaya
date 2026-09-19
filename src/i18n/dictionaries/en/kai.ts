/** Marketing copy for Kai: the home page section, the /kai page and the demo conversations. */

export interface KaiDemoScenario {
  id: string;
  chip: string;
  question: string;
  steps: string[];
  lead: string;
  lines: { text: string; cite: number[]; unverified?: boolean }[];
  close: string;
  sources: { type: "fact" | "icp" | "competitor" | "learning" | "strategy" | "metric"; label: string; detail: string; confidence?: number }[];
}

export const kai = {
  metaTitle: "Kai: talk to your business",
  metaDescription: "Kai answers questions about your customers, pricing, competitors and experiments from your product memory, and shows the source of every line.",
  newBadge: "New",
  eyebrow: "Kai, now in every workspace",
  tryDemo: "Try Kai in the demo",
  discover: "Discover Kai",
  startFree: "Start free",

  home: {
    title: "Ask your business anything",
    body: "Customers, pricing, competitors, what your last experiments proved: Kai answers from your product memory and shows where every line comes from.",
    cta: "Discover Kai",
    panelTitle: "Ask Kai",
    close: "Close",
    items: [
      { title: "Who are our best customers?", hint: "Profiles, needs and buying triggers", question: "Who are our best customers and what do they need?" },
      { title: "Compare our pricing", hint: "Your plans next to your competitors'", question: "Compare our pricing with our competitors" },
      { title: "What did our experiments prove?", hint: "Winners, losers and what's still open", question: "What have we learned from our experiments?" },
      { title: "Summarize our strategy", hint: "Positioning, channels and priorities", question: "Summarize our current strategy" },
      { title: "How should we sound?", hint: "Your brand voice and its traits", question: "Describe our brand voice" },
    ],
  },

  /* The interactive demo */
  demo: {
    label: "Kai demo",
    fictional: "Example from the Tickwarden demo workspace",
    windowTitle: "Kai",
    windowSub: "Tickwarden · product memory",
    memory: "Memory connected",
    you: "You",
    thinking: "Kai is reading your memory…",
    sourcesTitle: "{count} sources from your memory",
    replay: "Replay",
    pause: "Pause",
    play: "Play",
    placeholder: "Ask about your customers, pricing, strategy…",
    unverified: "Unverified",
    confidence: "{value}% confidence",
    types: { fact: "Fact", icp: "Customer", competitor: "Competitor", learning: "Learning", strategy: "Strategy", metric: "Goal" },
    scenarios: <KaiDemoScenario[]>[
      {
        id: "customers",
        chip: "Customers",
        question: "Who are our best customers and what do they need?",
        steps: ["Understood: customers", "Found 3 customer profiles", "Wrote the answer"],
        lead: "Your memory holds three customer profiles. Here they are, with what each one needs:",
        lines: [
          { text: "Backend engineers at 5–50 person startups who own billing, backup and sync jobs in production.", cite: [1] },
          { text: "Indie hackers with production side projects who want alerts without an observability suite.", cite: [2] },
          { text: "Platform teams standardizing how dozens of services report scheduled work.", cite: [3] },
        ],
        close: "Want me to compare what each profile objects to?",
        sources: [
          { type: "icp", label: "Backend engineers at early-stage startups", detail: "Own billing, backup and sync jobs; can expense a tool." },
          { type: "icp", label: "Indie hackers with production side projects", detail: "Alerts without paying for an observability suite." },
          { type: "icp", label: "Platform / SRE teams", detail: "Standardizing how services report scheduled work." },
        ],
      },
      {
        id: "pricing",
        chip: "Pricing",
        question: "Compare our pricing with Cronitor and Healthchecks.io",
        steps: ["Understood: pricing, competitors", "Found 1 pricing fact, 2 competitors", "Wrote the answer"],
        lead: "Here is what your memory says, side by side:",
        lines: [
          { text: "Tickwarden: Hobby free (20 monitors), Team $29/mo, Business $99/mo, 14-day trial.", cite: [1] },
          { text: "Cronitor: free tier, then paid per monitor. Your wedge: simpler setup and pricing under 50 monitors.", cite: [2] },
          { text: "Healthchecks.io: generous free tier. Your wedge: late-run detection that understands cron and time zones.", cite: [3] },
        ],
        close: "Should I dig into how each one prices beyond 50 monitors?",
        sources: [
          { type: "fact", label: "pricing.model", detail: "Freemium: Hobby free; Team $29/mo; Business $99/mo.", confidence: 95 },
          { type: "competitor", label: "Cronitor", detail: "Free tier; paid plans per monitor.", confidence: 90 },
          { type: "competitor", label: "Healthchecks.io", detail: "Generous free tier; hosted paid plans.", confidence: 86 },
        ],
      },
      {
        id: "learnings",
        chip: "Learnings",
        question: "What have we learned from our experiments?",
        steps: ["Understood: learnings", "Found 4 recorded learnings", "Wrote the answer"],
        lead: "Four conclusions are on record. Two winners, one loser, one still open:",
        lines: [
          { text: "Confirmed: a dedicated Cronitor comparison page converts better than the home page.", cite: [1] },
          { text: "Confirmed: “cron job monitoring” searches bring paying customers under the $60 CAC target.", cite: [2] },
          { text: "Disproved: broad developer targeting on Meta stays above the $60 CAC target.", cite: [3] },
          { text: "Unverified: annual billing by default may lift trial-to-paid. Not proven yet.", cite: [4], unverified: true },
        ],
        close: "Which one should we build on next?",
        sources: [
          { type: "learning", label: "winner", detail: "Comparison page beats the home page for “alternative” searches.", confidence: 99 },
          { type: "learning", label: "winner", detail: "High-intent search converts below the CAC target.", confidence: 96 },
          { type: "learning", label: "loser", detail: "Broad Meta targeting misses the CAC target.", confidence: 97 },
          { type: "learning", label: "insight", detail: "Annual billing by default: unresolved.", confidence: 60 },
        ],
      },
      {
        id: "honest",
        chip: "When it doesn't know",
        question: "Why did MRR drop in March?",
        steps: ["Understood: goals, revenue", "Found your goal, no dated revenue series", "Asked instead of guessing"],
        lead: "I can't explain a change I have no measurements for. Here is what I do know:",
        lines: [
          { text: "Your goal: grow MRR from $4.2k to $10k. It's in your memory, with its baseline and target.", cite: [1] },
          { text: "Your memory has no dated MRR series for March, so I won't invent a cause.", cite: [] },
        ],
        close: "Connect Stripe, or tell me which values to compare, and I'll look again.",
        sources: [{ type: "metric", label: "Grow MRR from $4.2k to $10k", detail: "4,180 → 10,000 usd" }],
      },
    ],
  },

  /* The /kai page */
  page: {
    heroTitleA: "Talk to your business.",
    heroTitleB: "Kai answers from what it knows.",
    heroBody: "Kai is the conversational side of Kaya. It reads your product memory, customers, competitors, strategy and experiment results, then answers in plain words with the source of every line.",
    heroNote: "Included in every Kaya workspace · English and French",

    howEyebrow: "How Kai answers",
    howTitle: "No magic. Just your memory, read carefully.",
    how: [
      { id: "memory", title: "It starts from your memory", body: "Everything Kaya learned about your product while analyzing it and running experiments, organized and scored.", chips: ["Facts", "Customers", "Competitors", "Learnings", "Experiments", "Strategy", "Goal", "Brand voice"] },
      { id: "retrieve", title: "It pulls only what matters", body: "Kai works out what your question is about, then picks the relevant pieces, and follows up on the topic of your previous message.", chips: ["Pricing", "Audience", "Competitors", "Learnings"] },
      { id: "answer", title: "It answers with receipts", body: "Each answer lists its sources and their confidence. Anything not yet confirmed is labelled “Unverified”.", chips: ["Sources", "Confidence", "Unverified"] },
    ],

    askEyebrow: "What you can ask",
    askTitle: "Start with a question you already have.",
    askBody: "Each prompt opens Kai in the demo workspace with the question ready to send.",
    askGroups: [
      { id: "customers", title: "Customers", prompts: ["Who are our best customers and what do they need?", "What objections come up the most?", "What triggers someone to look for us?"] },
      { id: "pricing", title: "Pricing", prompts: ["Summarize our pricing", "Compare our pricing with our competitors", "What does our free plan include?"] },
      { id: "competitors", title: "Competitors", prompts: ["Who are our main competitors?", "How are we different from Cronitor?", "Where are we weakest against the competition?"] },
      { id: "strategy", title: "Strategy", prompts: ["Summarize our current strategy", "What are our strategic priorities?", "What is our positioning?"] },
      { id: "experiments", title: "Experiments", prompts: ["What have we learned from our experiments?", "Which experiments are running?", "What did the last test prove?"] },
      { id: "brand", title: "Brand", prompts: ["How should we sound?", "Describe our brand voice", "What is our product in one sentence?"] },
    ],

    honestEyebrow: "Honest by design",
    honestTitleA: "An assistant you can trust",
    honestTitleB: "because it shows its work.",
    honest: [
      { id: "sources", title: "Sources on every answer", body: "Open the sources under any answer to see the exact fact, profile or learning it came from." },
      { id: "unverified", title: "Doubt is labelled", body: "Facts you haven't confirmed, or with low confidence, are marked “Unverified” in the answer itself." },
      { id: "unknown", title: "It won't make things up", body: "When your memory has nothing on a topic, Kai says so and asks a sharper question." },
      { id: "private", title: "Your conversations stay yours", body: "Every conversation belongs to you and to its workspace. Teammates don't see your chats." },
    ],
    unknownQuestion: "What's our churn rate?",
    unknownAnswer: "I don't have a dated measurement series for that, so I can't confirm the current value. Which period would you like to compare?",

    historyEyebrow: "Built for real work",
    historyTitle: "Pick up exactly where you left off.",
    historyBody: "Kai keeps every conversation, so an idea from Monday is still there on Friday.",
    historyPoints: [
      "Search across titles and messages",
      "Rename a conversation to find it later",
      "Archive what's done, restore it anytime",
      "Edit a question and get a fresh answer",
    ],
    historyMock: {
      title: "Your conversations",
      new: "New conversation",
      search: "Search…",
      items: ["Compare our pricing with Cronitor", "Objections from backend engineers", "What the Show HN launch taught us", "Q3 positioning ideas"],
      dates: ["Today", "Yesterday", "Mon", "Sep 2"],
      archived: "Archived",
    },

    everywhereEyebrow: "Everywhere in Kaya",
    everywhereTitle: "Kai is one shortcut away.",
    everywhereBody: "Press ⌘J on any screen. Kai shows what's waiting for your approval and can hand the top-ranked action to the agent, which still follows your guardrails.",
    everywhereMock: { greeting: "Hi Sam, what are we growing today?", run: "Run the top action", runSub: "Launch the Cronitor comparison page", waiting: "2 decisions waiting for you", placeholder: "Give the agent a goal…" },

    compareEyebrow: "Kai vs a generic chatbot",
    compareTitle: "It already knows your business.",
    compareKai: "Kai",
    compareGeneric: "Generic chatbot",
    compare: [
      { label: "Knows your customers, pricing and competitors", kai: true, generic: false },
      { label: "Shows where every line comes from", kai: true, generic: false },
      { label: "Labels facts that aren't confirmed", kai: true, generic: false },
      { label: "Refuses to invent numbers it doesn't have", kai: true, generic: false },
      { label: "Remembers what your experiments proved", kai: true, generic: false },
      { label: "Hands work to an agent with guardrails", kai: true, generic: false },
    ],

    faqTitle: "Questions about Kai",
    faq: [
      { q: "Is Kai a chatbot like ChatGPT?", a: "No. Kai doesn't browse the web or write from general knowledge. It answers from your workspace's product memory and shows the source of each line." },
      { q: "Where does Kai's knowledge come from?", a: "From what Kaya gathered about your product: the analysis of your site, the facts you confirmed, your customer profiles, competitors, strategy, experiments and learnings." },
      { q: "What if my memory is empty or wrong?", a: "Kai tells you the information isn't recorded yet. Correct or confirm facts in Business memory and Kai's next answer uses them." },
      { q: "Can Kai take actions?", a: "Kai answers. From the ⌘J panel, it can hand the top-ranked action to the Kaya agent, which follows your autonomy settings and waits for approval when required." },
      { q: "Which languages does Kai speak?", a: "English and French. Excerpts from your memory are quoted as they were recorded." },
      { q: "Who can see my conversations?", a: "Only you. Conversations are tied to your account and to the workspace they started in." },
    ],

    ctaTitle: "Ask your first question in 30 seconds.",
    ctaBody: "Open the demo workspace, or start free and let Kaya build your product memory.",
  },
};
