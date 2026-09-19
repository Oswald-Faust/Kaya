export const pageTours = {
  label: "Page tour",
  replay: "Tour this page",
  start: "Show me",
  skip: "Not now",
  close: "Close tour",
  previous: "Previous",
  next: "Next",
  finish: "Got it",
  stepOf: "{index} of {total}",
  introMeta: "{count} points · 30 seconds",
  pages: {
    command: {
      name: "Command Center",
      intro: "Your daily starting point. In one screen: where the business stands, what the agent recommends and what needs your decision.",
      steps: {
        "cc-header": { title: "Your cockpit", body: "The product, how fresh the data is and the window every figure covers. Open the agent from here when you have a new goal." },
        "cc-metrics": { title: "The numbers that matter", body: "MRR, signups, new customers and CAC, straight from your connected tools. Hover a figure to see exactly how it's calculated." },
        "cc-brief": { title: "The agent's brief", body: "What changed since yesterday and why it matters, written by the agent from your data. Read this first." },
        "cc-actions": { title: "What to do next", body: "Experiments ranked by impact, confidence and cost. Start with the top one: Run hands it to the agent, which drafts and executes it." },
        "cc-decisions": { title: "Your decisions", body: "Anything that spends money or publishes waits here for your approval. Nothing risky happens without you." },
        "cc-learned": { title: "What we learned", body: "The latest conclusions from finished experiments. They change what the agent recommends next." },
        "kai-launcher": { title: "Kai, on every screen", body: "Ask Kai anything or launch the top action from anywhere. Shortcut: ⌘J." },
      },
    },
    kai: {
      name: "Kai",
      intro: "Your conversational growth co-pilot, powered by real-time RAG on your business memory.",
      steps: {
        "kai-header": { title: "Meet Kai", body: "Discuss your product, strategy, target audience and metrics. Kai retrieves ground truth from your workspace data." },
      },
    },
    agent: {
      name: "AI Agents",
      intro: "Where autonomous execution agents run your experiments and multi-step growth tasks.",
      steps: {
        "agent-header": { title: "Autonomous workers", body: "Execution agents plan steps, call tools inside your policy guardrails, and wait for your approval before risky actions." },
        "agent-ask": { title: "Launch an agent mission", body: "Set a concrete execution objective. The agent analyzes context, executes tools, and saves deliverables." },
        "agent-runs": { title: "Every execution run", body: "Follow active and completed runs, with steps, tool calls, logs, and outputs." },
        "agent-approvals": { title: "Waiting for your decision", body: "Actions exceeding your autonomy threshold pause here for human review." },
      },
    },
    run: {
      name: "Agent run",
      intro: "The full story of one run: what the agent planned, did and produced, step by step.",
      steps: {
        "run-header": { title: "The goal", body: "What you asked for, when it started, which planner was used and how many tools it called." },
        "run-deliverables": { title: "What it produced", body: "Pages, emails, ads or posts the agent drafted. Copy them or let it publish once approved." },
        "run-conversation": { title: "The conversation", body: "The agent explains what it's doing and why, in plain words." },
        "run-plan": { title: "The plan", body: "The steps the agent chose and the reason for each one." },
        "run-decision": { title: "Your decision", body: "This run is paused on an action that needs your approval." },
        "run-timeline": { title: "The timeline", body: "Every tool call with its result and the policy check behind it: a complete audit trail." },
        "run-outcome": { title: "The outcome", body: "What changed in your workspace once the run finished." },
      },
    },
    strategy: {
      name: "Strategy",
      intro: "Your growth plan, written from what Kaya knows about your product, your market and your goal.",
      steps: {
        "strategy-header": { title: "A living strategy", body: "It's versioned: every revision is dated and signed. Rebuild it after a big change in your product or market." },
        "strategy-body": { title: "Positioning, channels, bets", body: "Who you sell to, the angle that wins, the channels ranked by fit and the experiments that follow from them." },
        "strategy-history": { title: "Why it changed", body: "Each version links to the evidence that changed it, so you always know why the plan moved." },
      },
    },
    experiments: {
      name: "Experiments",
      intro: "Every growth idea becomes a measured experiment. This is the full list.",
      steps: {
        "exps-header": { title: "Your track record", body: "How many experiments finished and how many won. That rate is how Kaya measures its own work." },
        "exps-views": { title: "Views", body: "Queue shows what's next by priority, Running what's live, Completed the results. Suppressed are ideas memory ruled out." },
        "exps-table": { title: "Each experiment", body: "Channel, metric, budget and status on one line. Open one to read its brief and launch it." },
      },
    },
    experiment: {
      name: "Experiment",
      intro: "Everything about one experiment: the bet, the reasoning, how it's measured and where it stands.",
      steps: {
        "xd-actions": { title: "Launch it", body: "Hand the experiment to the agent. It drafts what's needed and stops for your approval before spending or publishing." },
        "xd-lifecycle": { title: "Where it stands", body: "From idea to verdict. The highlighted step is the current one." },
        "xd-hypothesis": { title: "The hypothesis", body: "The bet in one sentence, the audience it targets and the single metric that decides it." },
        "xd-brief": { title: "The brief", body: "What will be done, why now, how it's measured, what you learn either way and what could go wrong." },
        "xd-result": { title: "Success criteria", body: "The threshold to beat, what's observed so far and the confidence level. The verdict follows these numbers only." },
        "xd-design": { title: "Setup", body: "Budget, daily cap, duration and dates. Spend never exceeds what's shown here." },
        "xd-ranked": { title: "Why this rank", body: "The factors behind its priority score, including past learnings that push it up or down." },
      },
    },
    learnings: {
      name: "Learnings",
      intro: "What every finished experiment taught you. This is how Kaya gets smarter about your business.",
      steps: {
        "learn-header": { title: "Your learning bank", body: "Each experiment leaves a conclusion here, whether it won or not." },
        "learn-group": { title: "Winners, losers, inconclusive", body: "Each learning shows its evidence and which future recommendations it influences." },
      },
    },
    analytics: {
      name: "Analytics",
      intro: "Business results, not vanity metrics. Kaya judges every experiment against these numbers.",
      steps: {
        "an-header": { title: "Real data", body: "Figures come from your revenue and analytics connections, dated to their last sync." },
        "an-kpis": { title: "Unit economics", body: "MRR, ARPU, CAC, payback, ROAS and churn. Hover any figure to see its formula." },
        "an-charts": { title: "Trends", body: "MRR and signups over time, so you can see what each experiment moved." },
        "an-funnel": { title: "The funnel", body: "From visit to paying customer. The weakest step is usually where the next experiment should go." },
        "an-economics": { title: "By channel", body: "Spend, customers and CAC for each channel, to know where the next dollar works hardest." },
      },
    },
    memory: {
      name: "Business memory",
      intro: "Everything the agent knows about your business. It only acts on what you've confirmed.",
      steps: {
        "mem-header": { title: "What the agent knows", body: "Confirmed facts, proposals waiting for review and superseded ones, each with its source." },
        "mem-facts": { title: "Facts", body: "Each fact has a source and a confidence level. Correct anything that's wrong: the agent will follow." },
        "mem-icps": { title: "Your customers", body: "The ideal customer profiles the agent targets in its experiments." },
        "mem-competitors": { title: "Competitors", body: "Who you're up against and how you differ. Used for positioning and comparison pages." },
      },
    },
    campaigns: {
      name: "Campaigns",
      intro: "Paid launches across channels. Every campaign exists to run an experiment.",
      steps: {
        "camp-header": { title: "Active spend", body: "What's being spent per day right now, across every channel." },
        "camp-table": { title: "Each campaign", body: "Channel, budget, spend and results, each tied to the experiment it serves." },
      },
    },
    content: {
      name: "Content",
      intro: "Everything the agent writes for you: pages, emails, ads and posts.",
      steps: {
        "content-header": { title: "Drafted for you", body: "The agent writes from facts you confirmed, in your language. Nothing goes out without approval." },
        "content-list": { title: "Each asset", body: "Its status, its channel and the experiment it belongs to. Open one to review it." },
      },
    },
    seo: {
      name: "SEO",
      intro: "From search queries to pages, rankings and conversions.",
      steps: {
        "module-header": { title: "The SEO channel", body: "Pages built to capture searches your buyers already make." },
        "module-experiments": { title: "Experiments on this channel", body: "Every SEO bet in progress or completed, with its status." },
        "module-roadmap": { title: "What's coming", body: "The capabilities this module is getting and the connections it depends on." },
      },
    },
    creators: {
      name: "Creators",
      intro: "Discovery, outreach, deals and the revenue creators bring.",
      steps: {
        "module-header": { title: "The creator channel", body: "Creators your audience already follows, measured on the customers they bring." },
        "module-experiments": { title: "Experiments on this channel", body: "Every creator bet in progress or completed, with its status." },
        "module-roadmap": { title: "What's coming", body: "The capabilities this module is getting and the connections it depends on." },
      },
    },
    integrations: {
      name: "Integrations",
      intro: "Connections give the agent real data and the ability to act. Start with your revenue tool.",
      steps: {
        "int-header": { title: "Why connect", body: "Without data, the agent guesses. With Stripe and analytics, it measures real revenue and signups." },
        "int-connected": { title: "Connected", body: "Health, last sync and the capabilities each connection grants the agent." },
        "int-catalog": { title: "Catalog", body: "Grouped by domain. Connect with an API key or sign in; every change they make is recorded." },
      },
    },
    settings: {
      name: "Settings",
      intro: "Your workspace, your team, your language and how much freedom the agent gets.",
      steps: {
        "set-nav": { title: "Sections", body: "General, team, preferences, agent autonomy, billing and your account." },
        "set-general": { title: "Workspace", body: "Name, icon and address of your workspace." },
        "set-danger": { title: "Danger zone", body: "Deleting a workspace removes all its data for good. Owners only." },
      },
    },
  },
};
