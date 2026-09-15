import { Plus } from "lucide-react";

const QUESTIONS = [
  {
    q: "Will it spend my money without asking?",
    a: "Not unless you tell it to. Spending is governed in code, not by the model: hard caps on daily spend, monthly budget and per-experiment budget can't be approved away. In Copilot mode, the default, every publish and every budget increase waits for you. Cutting spend on a losing ad is the one thing it can do on its own.",
  },
  {
    q: "What do I need on day one?",
    a: "A URL. In about two minutes you get a business profile to confirm, a channel strategy and a ranked queue of first experiments. Connect Stripe and your analytics when you want results measured against revenue rather than clicks.",
  },
  {
    q: "How do I know the AI isn't making things up about my product?",
    a: "Every fact it extracts links to the page it came from, with a confidence score. Claims that can't be found in the crawl are down-weighted, invented prices are dropped, and nothing inferred drives a decision until you confirm it. Instructions hidden in web pages are detected and ignored.",
  },
  {
    q: "Which channels does it work with?",
    a: "Google Search, SEO pages, Meta Ads, LinkedIn, X, Reddit, Hacker News, YouTube creators, TikTok and lifecycle email. It measures through Stripe, Paddle, Lemon Squeezy, GA4, PostHog, Plausible and Search Console.",
  },
  {
    q: "Where do the numbers come from?",
    a: "From a deterministic metrics engine, not a language model. Every KPI shows its formula and inputs, and experiments are judged with two-proportion and Poisson tests. When a result isn't significant, it says so instead of calling a winner.",
  },
  {
    q: "Who is it built for?",
    a: "Founders of software products who can build but don't have a marketing team: from first paying users to a few hundred thousand in ARR.",
  },
];

export function Faq({ questions = QUESTIONS }: { questions?: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {questions.map(({ q, a }) => (
        <details key={q} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="flex-1 text-lg font-medium text-ink">{q}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-transform duration-300 group-open:rotate-45 group-open:bg-ink group-open:text-white">
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="max-w-2xl pr-14 pb-6 text-base leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
