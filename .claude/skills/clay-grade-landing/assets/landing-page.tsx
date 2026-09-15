import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { StartForm } from "@/components/onboarding/start-form";
import { KayaMark } from "@/components/brand/logo";
import { BrandIcon, BRANDS, type BrandName } from "@/components/brand/brand-logos";
import { DecideSpot, ExperimentSpot, LearnSpot, UnderstandSpot } from "@/components/brand/clay";
import { UseCaseTabs } from "@/components/landing/use-case-tabs";
import { AutonomyDial } from "@/components/landing/autonomy-dial";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { Faq } from "@/components/landing/faq";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { CountUp, InView, Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import type { MarketingLinks } from "@/server/marketing";
import { cn } from "@/lib/cn";

const button = {
  black: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-ink-hover",
  white: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-[15px] font-medium text-ink transition-colors hover:border-ink",
};

/**
 * The Kaya home page body, shared by both versions of the landing page.
 * `overlapStack` pulls the integrations card over the hero, as on Clay.
 */
export function LandingPage({ hero, links, overlapStack = false }: { hero: ReactNode; links: MarketingLinks; overlapStack?: boolean }) {
  const { appHref, demoHref, demoSlug } = links;
  const inDemo = (path: string) => (demoSlug ? `/w/${demoSlug}${path}` : "/start");

  return (
    <div className="bg-surface text-ink">
      <Link href="/pricing" className="relative z-[60] flex h-10 items-center justify-center gap-2 bg-lime px-4 text-sm font-medium text-ink">
        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-lime">New</span>
        <span className="truncate">Kaya pricing is live: start free, pay as the agent does more</span>
        <ArrowRight className="size-3.5 shrink-0" />
      </Link>

      <SiteNav appHref={appHref} demoHref={demoHref} />

      {hero}

      {/* ───────── Stack ───────── */}
      <section className={cn("relative z-10 px-3 sm:px-5", overlapStack ? "-mt-32" : "pt-4 sm:pt-5")}>
        <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-cream py-8 sm:py-10">
          <Reveal className="px-6 pb-8 text-center">
            <p className="mx-auto max-w-2xl text-[clamp(20px,2vw,28px)] leading-snug tracking-[-0.02em]">
              Works with the stack growing software companies already run. <span className="font-semibold">Connected</span> today,{" "}
              <span className="font-semibold">more</span> every month.
            </p>
          </Reveal>
          <LogoMarquee />
        </div>
      </section>

      {/* ───────── Use cases ───────── */}
      <section id="product" className="mx-auto max-w-[1360px] scroll-mt-24 px-5 pt-28 sm:pt-36">
        <Reveal className="text-center">
          <h2 className="text-[clamp(42px,5.6vw,80px)] leading-[0.98] font-medium tracking-[-0.045em]">
            Founders grow
            <br />
            on Kaya
          </h2>
        </Reveal>
        <UseCaseTabs />
      </section>

      {/* ───────── What do you want to grow ───────── */}
      <section id="grow" className="scroll-mt-24 px-5 pt-28 sm:pt-36">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-[clamp(38px,4.6vw,60px)] leading-[1] font-medium tracking-[-0.045em]">What do you want to grow?</h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 rounded-[28px] border border-line bg-surface p-3 shadow-float sm:p-4">
            <StartForm autoFocus={false} className="" suggestions={["linear.app", "cal.com", "plausible.io"]} />
          </Reveal>
          <Stagger className="mt-6 divide-y divide-line">
            {["Get me my first 20 paying users.", "We have $500 this month. Find the best way to spend it.", "Why did signups fall this week?"].map((ask) => (
              <StaggerItem key={ask} className="flex items-center gap-3 py-3.5 text-[15px] text-muted">
                <span className="grid size-7 place-items-center rounded-lg bg-cream">
                  <KayaMark tile={false} className="size-4" />
                </span>
                <span>
                  Then ask Kaya: <span className="text-ink">“{ask}”</span>
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ───────── The loop ───────── */}
      <section className="px-3 pt-28 sm:px-5 sm:pt-36">
        <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-cream">
          <Reveal className="px-6 pt-14 text-center sm:pt-20">
            <h2 className="mx-auto max-w-3xl text-[clamp(38px,4.8vw,64px)] leading-[1] font-medium tracking-[-0.045em]">Understand, decide, test and learn. Every week.</h2>
          </Reveal>
          <InView amount={0.25}>
            <Stagger className="mt-8 grid grid-cols-2 md:grid-cols-4" stagger={0.12}>
              {(
                [
                  ["Understand", "Reads your site and confirms facts with you.", UnderstandSpot],
                  ["Decide", "Scores channels and splits the budget.", DecideSpot],
                  ["Experiment", "Runs tests with a cap and a deadline.", ExperimentSpot],
                  ["Learn", "Keeps what worked, drops what didn't.", LearnSpot],
                ] as const
              ).map(([label, text, Spot], i) => (
                <StaggerItem key={label} className="flex flex-col items-center px-4 pb-10 text-center">
                  <Spot className="w-full max-w-[280px]" />
                  <p className="-mt-2 text-lg font-medium tracking-[-0.02em]">
                    <span className="mr-1.5 font-mono text-xs text-subtle">0{i + 1}</span>
                    {label}
                  </p>
                  <p className="mt-1 max-w-[16rem] text-sm text-muted">{text}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </InView>
        </div>
      </section>

      {/* ───────── Pillars ───────── */}
      <div id="platform" className="scroll-mt-24 space-y-4 px-3 pt-4 sm:space-y-5 sm:px-5 sm:pt-5">
        <Pillar
          id="pillar-understand"
          tone="blue"
          tag="Understand"
          title={["Know your product", "better than a new hire"]}
          body="Kaya reads your pricing, docs and changelog, then writes down who buys, what they compare you with and why they switch. Every fact links to its source, and nothing drives spend until you confirm it."
          brands={["stripe", "posthog", "searchconsole"]}
          proof={["Sources and confidence on every fact", "Ignores instructions hidden in web pages", "ICPs, competitors and wedges you can edit"]}
          cta={{ label: "Analyze my product", href: "/start" }}
          visual={<UnderstandSpot className="w-full max-w-[460px]" />}
        />
        <Pillar
          id="pillar-decide"
          tone="tangerine"
          tag="Decide"
          title={["Spend where money", "can actually learn"]}
          body="Each channel gets a fit score from your audience, price point, sales motion and budget. Kaya splits the budget where a test can reach significance and keeps a reserve instead of five $40 experiments that prove nothing."
          brands={["googleads", "meta", "linkedin"]}
          proof={["Channel fit from 0 to 100, with reasons", "Says “not yet” to channels your budget can't feed", "30, 60 and 90-day plan tied to your goal"]}
          cta={{ label: "See a strategy", href: inDemo("/strategy") }}
          visual={<DecideSpot className="w-full max-w-[460px]" />}
          flip
        />
        <Pillar
          id="pillar-experiment"
          tone="grass"
          tag="Experiment"
          title={["Run experiments,", "not campaigns"]}
          body="A ranked queue of tests, each with a hypothesis, a success metric, a budget cap and a time to signal. Results are judged with real statistics, so an inconclusive test is called inconclusive."
          brands={["googleads", "reddit", "hackernews"]}
          proof={["Two-proportion and Poisson tests on every result", "Losing ads paused as soon as they cost too much", "Disproved tactics never come back"]}
          cta={{ label: "Explore experiments", href: inDemo("/experiments") }}
          visual={<ExperimentSpot className="w-full max-w-[460px]" />}
        />
        <Pillar
          id="control"
          tone="lilac"
          tag="Control"
          title={["An agent with the keys.", "You keep the safe."]}
          body="Every action has a risk class, from reading a report to moving money. Choose how far Kaya goes on its own. Budget caps are enforced in code and checked again at the moment of execution, even after you approve."
          proof={["Idempotent tool calls: a retry never double-spends", "Approvals explain which rule triggered", "Append-only audit log of every action"]}
          cta={{ label: "See approvals", href: inDemo("/agent") }}
          visual={
            <div className="w-full max-w-[520px]">
              <AutonomyDial />
            </div>
          }
          flip
        />
        <Pillar
          id="pillar-learn"
          tone="sun"
          tag="Learn"
          title={["Every result makes", "next month smarter"]}
          body="Winners become learnings that boost similar ideas. The strategy revises itself with a written reason, and a Monday brief tells you what changed, why, and the one decision that needs you."
          stats={[
            [13, "", "experiments run"],
            [6, "", "learnings saved"],
            [31, "+%", "best lift"],
          ]}
          statsNote="Tickwarden demo workspace"
          proof={["Every KPI shows its formula and inputs", "Strategy versions with evidence", "One brief a week, not twelve dashboards"]}
          cta={{ label: "Open the demo", href: demoHref }}
          visual={<LearnSpot className="w-full max-w-[460px]" />}
        />
      </div>

      {/* ───────── Demo stories ───────── */}
      <section className="mx-auto max-w-[1360px] px-5 pt-28 sm:pt-36">
        <Reveal>
          <h2 className="text-center text-[clamp(38px,4.8vw,64px)] leading-[1] font-medium tracking-[-0.045em]">
            Watch a growth loop run
            <br className="hidden sm:block" /> from start to finish
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-4 md:grid-cols-2" stagger={0.15}>
          <StaggerItem>
            <StoryCard
              href={demoHref}
              tone="bg-grass-soft"
              kicker="Demo workspace"
              title="How Tickwarden lifted trial starts 31% with one comparison page"
              visual={
                <InView className="rounded-2xl bg-surface p-5 shadow-float">
                  <p className="font-mono text-[11px] text-subtle uppercase">EXP-014 · winner</p>
                  <p className="mt-2 text-5xl font-medium tracking-[-0.05em]">
                    <CountUp to={31} prefix="+" suffix="%" />
                  </p>
                  <div className="mt-4 flex h-24 items-end gap-3">
                    <div className="m-anim m-bar h-[55%] flex-1 rounded-lg bg-stone" />
                    <div className="m-anim m-bar h-full flex-1 rounded-lg bg-grass [animation-delay:0.5s]" />
                  </div>
                </InView>
              }
            />
          </StaggerItem>
          <StaggerItem>
            <StoryCard
              href={inDemo("/agent")}
              tone="bg-tangerine-soft"
              kicker="Demo workspace"
              title="Watch the agent ask before it raises a Google Ads budget"
              visual={
                <div className="rounded-2xl bg-surface p-5 shadow-float">
                  <p className="flex items-center gap-2 font-mono text-[11px] text-subtle uppercase">
                    <BrandIcon brand="googleads" className="size-4" /> Needs approval
                  </p>
                  <p className="mt-2 text-xl font-medium tracking-[-0.03em]">$30 → $45 per day</p>
                  <p className="text-sm text-muted">+50% is above your +20% automatic limit</p>
                  <div className="mt-4 flex gap-2">
                    <span className="m-pulse rounded-lg bg-ink px-3 py-1.5 text-sm text-white">Approve</span>
                    <span className="rounded-lg border border-line-strong px-3 py-1.5 text-sm text-muted">Reject</span>
                  </div>
                </div>
              }
            />
          </StaggerItem>
        </Stagger>
      </section>

      {/* ───────── Resources ───────── */}
      <Stagger className="mx-auto grid max-w-[1360px] gap-4 px-5 pt-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        {[
          ["/start", "bg-lime", "Get started", "Paste your URL and get a strategy in two minutes", "Start free"],
          [demoHref, "bg-blue-soft", "Demo", "Explore a full workspace with 104 days of data", "Open demo"],
          ["/pricing", "bg-lilac-soft", "Pricing", "Start free, pay for what the agent does", "See plans"],
          ["/brand", "bg-cream", "Brand", "The Kaya identity: logo, palette, type and clay", "View brand"],
        ].map(([href, tone, kicker, title, cta]) => (
          <StaggerItem key={kicker}>
            <Link href={href} className={cn("group flex min-h-[220px] flex-col justify-between rounded-[24px] p-6 transition-transform duration-300 hover:-translate-y-1", tone)}>
              <div>
                <p className="font-mono text-[11px] tracking-wide text-ink/55 uppercase">{kicker}</p>
                <p className="mt-2 text-xl leading-snug font-medium tracking-[-0.03em]">{title}</p>
              </div>
              <p className="inline-flex items-center gap-1 text-sm font-medium">
                {cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto grid max-w-[1360px] scroll-mt-24 gap-10 px-5 pt-28 sm:pt-36 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2 className="text-[clamp(38px,4.4vw,60px)] leading-[1] font-medium tracking-[-0.045em]">
            Questions,
            <br />
            answered
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Faq />
        </Reveal>
      </section>

      <ClosingCta demoHref={demoHref} />
      <SiteFooter demoHref={demoHref} />
    </div>
  );
}

const TONES = {
  blue: { card: "bg-blue-soft", tag: "bg-blue text-white", accent: "text-blue-deep", dot: "bg-blue" },
  tangerine: { card: "bg-tangerine-soft", tag: "bg-tangerine text-white", accent: "text-tangerine-deep", dot: "bg-tangerine" },
  grass: { card: "bg-grass-soft", tag: "bg-grass text-white", accent: "text-grass-deep", dot: "bg-grass" },
  lilac: { card: "bg-lilac-soft", tag: "bg-lilac text-white", accent: "text-lilac-deep", dot: "bg-lilac" },
  sun: { card: "bg-sun-soft", tag: "bg-sun text-ink", accent: "text-sun-deep", dot: "bg-sun" },
} as const;

function Pillar({
  id,
  tone,
  tag,
  title,
  body,
  brands,
  stats,
  statsNote,
  proof,
  cta,
  visual,
  flip = false,
}: {
  id: string;
  tone: keyof typeof TONES;
  tag: string;
  title: [string, string];
  body: string;
  brands?: BrandName[];
  stats?: [number, string, string][];
  statsNote?: string;
  proof: string[];
  cta: { label: string; href: string };
  visual: ReactNode;
  flip?: boolean;
}) {
  const t = TONES[tone];
  return (
    <section id={id} className={cn("mx-auto max-w-[1360px] scroll-mt-24 overflow-hidden rounded-[32px]", t.card)}>
      <div className={cn("grid items-center gap-6 p-6 sm:p-12 lg:grid-cols-2 lg:gap-12", flip && "lg:[&>*:first-child]:order-2")}>
        <Stagger stagger={0.07}>
          <StaggerItem>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase", t.tag)}>{tag}</span>
              <span className={cn("size-2 animate-pulse-dot rounded-full opacity-60", t.dot)} />
              <span className={cn("size-2 rounded-full opacity-30", t.dot)} />
            </span>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 text-[clamp(36px,4.4vw,58px)] leading-[1] font-medium tracking-[-0.045em]">
              {title[0]}
              <br />
              <span className={t.accent}>{title[1]}</span>
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted">{body}</p>
          </StaggerItem>

          {brands && (
            <StaggerItem className="mt-8 flex flex-wrap items-center gap-2">
              {brands.map((b) => (
                <span key={b} className="grid size-9 place-items-center rounded-xl bg-surface shadow-sm transition-transform hover:-translate-y-0.5">
                  <BrandIcon brand={b} className="size-[18px]" />
                </span>
              ))}
              <span className="ml-1 text-sm text-muted">Connects with {brands.map((b) => BRANDS[b].title).join(", ")}</span>
            </StaggerItem>
          )}
          {stats && (
            <StaggerItem className="mt-8">
              <div className="flex gap-8">
                {stats.map(([value, affix, label]) => (
                  <div key={label}>
                    <p className="text-4xl font-medium tracking-[-0.05em]">
                      <CountUp to={value} prefix={affix.startsWith("+") ? "+" : ""} suffix={affix.endsWith("%") ? "%" : ""} />
                    </p>
                    <p className="text-sm text-muted">{label}</p>
                  </div>
                ))}
              </div>
              {statsNote && <p className="mt-2 font-mono text-[10px] text-subtle uppercase">{statsNote}</p>}
            </StaggerItem>
          )}

          <StaggerItem>
            <ul className="mt-6 space-y-2 border-t border-ink/10 pt-6">
              {proof.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[15px] text-ink">
                  <Check className={cn("mt-1 size-4 shrink-0", t.accent)} />
                  {line}
                </li>
              ))}
            </ul>
          </StaggerItem>

          <StaggerItem className="mt-8 flex flex-wrap gap-2">
            <Link href="/start" className={button.black}>
              Start free <ArrowRight className="size-4" />
            </Link>
            <Link href={cta.href} className={button.white}>
              {cta.label}
            </Link>
          </StaggerItem>
        </Stagger>
        <InView className="flex items-center justify-center">
          <Reveal y={40} className="flex w-full justify-center">
            {visual}
          </Reveal>
        </InView>
      </div>
    </section>
  );
}

function StoryCard({ href, tone, kicker, title, visual }: { href: string; tone: string; kicker: string; title: string; visual: ReactNode }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-[28px] border border-line bg-surface p-2 transition-shadow hover:shadow-float">
      <div className={cn("bg-dots grid aspect-[16/10] place-items-center rounded-[22px] p-8 sm:p-14", tone)}>
        <div className="w-full max-w-sm transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1deg]">{visual}</div>
      </div>
      <div className="flex items-end justify-between gap-6 px-4 pt-5 pb-4">
        <div>
          <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">{kicker}</p>
          <p className="mt-1 text-xl font-medium tracking-[-0.03em]">{title}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform group-hover:rotate-45">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
