"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  BookOpen,
  Brain,
  Check,
  Compass,
  FileText,
  FlaskConical,
  Gauge,
  Megaphone,
  Plug,
  Search,
  Settings,
  Target,
  Users,
  X,
} from "lucide-react";
import { ExperimentSpot, LearnSpot } from "@/components/brand/clay";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * First-login product tour. A welcome modal, then a spotlight on each part of
 * the workspace (anchored on `data-tour` attributes), then a closing screen.
 * Targets that aren't on screen (the sidebar below `lg`) fall back to a
 * centered card, so the tour reads the same on a phone.
 */

type Placement = "right" | "bottom";

interface TourStep {
  target: string;
  placement: Placement;
  chapter: string;
  title: string;
  body: string;
  icon: ReactNode;
  tone: string;
  bullets?: { icon: ReactNode; label: string; text: string }[];
}

const STEPS: TourStep[] = [
  {
    target: "search",
    placement: "right",
    chapter: "Navigate",
    title: "Search or ask, from anywhere",
    body: "Press ⌘K to jump to any page or experiment. Type a full question and it goes straight to the agent.",
    icon: <Search />,
    tone: "bg-stone text-ink",
  },
  {
    target: "command-center",
    placement: "right",
    chapter: "Navigate",
    title: "Command Center",
    body: "Start your day here: progress toward your goal, the next best actions ranked by impact and confidence, and the experiments running right now.",
    icon: <Gauge />,
    tone: "bg-lime-soft text-lime-deep",
  },
  {
    target: "agent",
    placement: "right",
    chapter: "Navigate",
    title: "Agent",
    body: "Give the agent a goal. It pulls context, shows its plan and calls tools inside your policy. Anything risky waits for your approval, and the badge counts what's waiting.",
    icon: <Bot />,
    tone: "bg-agent-soft text-agent",
  },
  {
    target: "strategy",
    placement: "right",
    chapter: "Growth loop",
    title: "Strategy",
    body: "Built from what Kaya learned about your product and the goal you set. Each revision links to the evidence that changed it.",
    icon: <Compass />,
    tone: "bg-sun-soft text-sun-deep",
  },
  {
    target: "experiments",
    placement: "right",
    chapter: "Growth loop",
    title: "Experiments",
    body: "The basic unit of growth: hypothesis, audience, channel, budget, metric and success threshold. The badge shows how many are running.",
    icon: <FlaskConical />,
    tone: "bg-tangerine-soft text-tangerine-deep",
  },
  {
    target: "learnings",
    placement: "right",
    chapter: "Growth loop",
    title: "Learnings",
    body: "Every finished experiment writes a learning here: winner, loser or inconclusive. The next recommendations build on them.",
    icon: <BookOpen />,
    tone: "bg-grass-soft text-grass-deep",
  },
  {
    target: "analytics",
    placement: "right",
    chapter: "Growth loop",
    title: "Analytics",
    body: "MRR, signups and customers from your revenue and analytics tools. Kaya judges experiments on business results, not impressions.",
    icon: <Activity />,
    tone: "bg-blue-soft text-blue-deep",
  },
  {
    target: "memory",
    placement: "right",
    chapter: "Growth loop",
    title: "Business memory",
    body: "Everything the agent knows about your business, with its source and confidence. Only facts you've confirmed drive decisions.",
    icon: <Brain />,
    tone: "bg-lilac-soft text-lilac-deep",
  },
  {
    target: "execution",
    placement: "right",
    chapter: "Execution",
    title: "Where experiments go live",
    body: "Each channel exists to run an experiment, so every dollar and every asset can be judged against its threshold.",
    icon: <Megaphone />,
    tone: "bg-pink-soft text-pink-deep",
    bullets: [
      { icon: <Megaphone />, label: "Campaigns", text: "Paid launches across channels, with their spend." },
      { icon: <FileText />, label: "Content", text: "Ad copy, landing pages and emails drafted by the agent." },
      { icon: <Search />, label: "SEO", text: "From search queries to pages, rankings and conversions." },
      { icon: <Users />, label: "Creators", text: "Discovery, outreach, deals and the revenue they bring." },
    ],
  },
  {
    target: "integrations",
    placement: "right",
    chapter: "System",
    title: "Integrations",
    body: "Connect Stripe, analytics and ad accounts. The agent asks for capabilities, the connections provide them, and every change they make is recorded.",
    icon: <Plug />,
    tone: "bg-stone text-ink",
  },
  {
    target: "settings",
    placement: "right",
    chapter: "System",
    title: "Settings",
    body: "Rename your workspace, invite your team within your plan's seats, set how much autonomy the agent gets and its spending guardrails, and manage billing.",
    icon: <Settings />,
    tone: "bg-stone text-ink",
  },
  {
    target: "topbar",
    placement: "bottom",
    chapter: "Stay on track",
    title: "Your goal, always in view",
    body: "The top bar tracks progress toward your goal, shows where the growth loop stands and which autonomy mode the agent is in.",
    icon: <Target />,
    tone: "bg-lime-soft text-lime-deep",
  },
];

type Phase = "welcome" | "steps" | "done";

const POPOVER_WIDTH = 340;
const GAP = 14;
const MARGIN = 16;
const HALO = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findTarget(name: string): Rect | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return { top: r.top - HALO, left: r.left - HALO, width: r.width + HALO * 2, height: r.height + HALO * 2 };
  }
  return null;
}

export function ProductTour({
  open,
  slug,
  firstName,
  onClose,
}: {
  open: boolean;
  slug: string;
  firstName: string;
  /** Called once the tour is finished or skipped. */
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="tour" className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <TourFlow slug={slug} firstName={firstName} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Mounted only while the tour is open, so every opening starts from the welcome screen. */
function TourFlow({ slug, firstName, onClose }: { slug: string; firstName: string; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    if (phase === "welcome") return setPhase("steps");
    if (phase === "steps") return index < STEPS.length - 1 ? setIndex(index + 1) : setPhase("done");
    onClose();
  }, [phase, index, onClose]);

  const back = useCallback(() => {
    if (phase === "done") return setPhase("steps");
    if (phase === "steps") return index > 0 ? setIndex(index - 1) : setPhase("welcome");
  }, [phase, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <>
      {phase === "welcome" && <WelcomeCard firstName={firstName} onStart={next} onSkip={onClose} />}
      {phase === "steps" && <Spotlight step={STEPS[index]} index={index} onNext={next} onBack={back} onSkip={onClose} />}
      {phase === "done" && <DoneCard slug={slug} onBack={back} onClose={onClose} />}
    </>
  );
}

function Backdrop() {
  return <div className="absolute inset-0 bg-ink/45" aria-hidden />;
}

function WelcomeCard({ firstName, onStart, onSkip }: { firstName: string; onStart: () => void; onSkip: () => void }) {
  return (
    <CenteredDialog label="Welcome to Kaya" onDismiss={onSkip}>
      <div className="relative overflow-hidden bg-cream" data-inview="true">
        <ExperimentSpot className="mx-auto -mb-6 h-56 w-auto" />
      </div>
      <div className="px-6 pt-5 pb-6 text-center">
        <p className="text-xs font-medium text-agent">Your workspace is ready</p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">Welcome to Kaya{firstName ? `, ${firstName}` : ""}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Kaya runs your growth loop: strategy, experiments, learnings, then the next move. Take a minute to see what each part of your workspace does.
        </p>
        <div className="mt-5 flex flex-col-reverse items-center justify-center gap-2 sm:flex-row">
          <button type="button" onClick={onSkip} className={buttonClass("ghost", "lg", "w-full sm:w-auto")}>
            Skip for now
          </button>
          <AutoFocusButton onClick={onStart} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
            Show me around
            <ArrowRight className="size-4" />
          </AutoFocusButton>
        </div>
        <p className="mt-4 text-2xs text-subtle">{STEPS.length} short steps · about a minute</p>
      </div>
    </CenteredDialog>
  );
}

function DoneCard({ slug, onBack, onClose }: { slug: string; onBack: () => void; onClose: () => void }) {
  return (
    <CenteredDialog label="Tour complete" onDismiss={onClose}>
      <div className="relative overflow-hidden bg-lime-soft" data-inview="true">
        <LearnSpot className="mx-auto -mb-6 h-56 w-auto" />
      </div>
      <div className="px-6 pt-5 pb-6 text-center">
        <span className="mx-auto grid size-8 place-items-center rounded-full bg-positive text-white">
          <Check className="size-4" />
        </span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">You&apos;re all set</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          The fastest way to start is to give the agent a goal. You can replay this tour anytime from the sidebar or with ⌘K.
        </p>
        <div className="mt-5 flex flex-col-reverse items-center justify-center gap-2 sm:flex-row">
          <button type="button" onClick={onBack} aria-label="Previous step" className={buttonClass("ghost", "lg", "w-full sm:w-auto sm:px-2.5")}>
            <ArrowLeft className="size-4" />
            <span className="sm:hidden">Back</span>
          </button>
          <button type="button" onClick={onClose} className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
            Explore on my own
          </button>
          <Link href={`/w/${slug}/agent`} onClick={onClose} className={buttonClass("agent", "lg", "w-full sm:w-auto")}>
            <Bot className="size-4" />
            Give the agent a goal
          </Link>
        </div>
      </div>
    </CenteredDialog>
  );
}

function CenteredDialog({ label, onDismiss, children }: { label: string; onDismiss: () => void; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <>
      <Backdrop />
      <div className="absolute inset-0 grid place-items-center overflow-y-auto p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-lg bg-surface shadow-pop"
        >
          <button type="button" onClick={onDismiss} aria-label="Close tour" className="absolute top-3 right-3 z-10 grid size-7 place-items-center rounded-md bg-surface/80 text-muted backdrop-blur-sm hover:text-ink">
            <X className="size-4" />
          </button>
          {children}
        </motion.div>
      </div>
    </>
  );
}

function Spotlight({ step, index, onNext, onBack, onSkip }: { step: TourStep; index: number; onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const reduce = useReducedMotion();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [popoverHeight, setPopoverHeight] = useState(240);

  useLayoutEffect(() => {
    const measure = () => {
      setRect(findTarget(step.target));
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step.target]);

  useLayoutEffect(() => {
    if (popoverRef.current) setPopoverHeight(popoverRef.current.offsetHeight);
  }, [step, rect, viewport]);

  const placement = rect ? position(rect, step.placement, viewport, popoverHeight) : null;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 36 };

  const card = (
    <StepCard ref={popoverRef} step={step} index={index} onNext={onNext} onBack={onBack} onSkip={onSkip} arrow={placement?.arrow} placement={step.placement} />
  );

  if (!rect || !placement) {
    return (
      <>
        <Backdrop />
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:inset-0 sm:items-center">{card}</div>
      </>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute rounded-lg ring-2 ring-agent ring-offset-2 ring-offset-transparent"
        style={{ boxShadow: "0 0 0 9999px rgb(11 11 11 / 0.45)" }}
        initial={false}
        animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        transition={spring}
      />
      <motion.div className="absolute" initial={false} animate={{ top: placement.top, left: placement.left }} transition={spring}>
        {card}
      </motion.div>
    </>
  );
}

function position(rect: Rect, placement: Placement, viewport: { width: number; height: number }, popoverHeight: number) {
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));
  if (placement === "right") {
    const left = rect.left + rect.width + GAP;
    if (left + POPOVER_WIDTH > viewport.width - MARGIN) return null;
    const top = clamp(rect.top + rect.height / 2 - popoverHeight / 2, MARGIN, viewport.height - popoverHeight - MARGIN);
    return { top, left, arrow: clamp(rect.top + rect.height / 2 - top, 20, popoverHeight - 20) };
  }
  const top = rect.top + rect.height + GAP;
  if (top + popoverHeight > viewport.height - MARGIN) return null;
  const left = clamp(rect.left + rect.width / 2 - POPOVER_WIDTH / 2, MARGIN, viewport.width - POPOVER_WIDTH - MARGIN);
  return { top, left, arrow: clamp(rect.left + rect.width / 2 - left, 20, POPOVER_WIDTH - 20) };
}

function StepCard({
  ref,
  step,
  index,
  onNext,
  onBack,
  onSkip,
  arrow,
  placement,
}: {
  ref: Ref<HTMLDivElement>;
  step: TourStep;
  index: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  arrow?: number;
  placement: Placement;
}) {
  const last = index === STEPS.length - 1;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-body"
      className="relative w-full rounded-lg bg-surface shadow-pop sm:w-[340px]"
    >
      {arrow !== undefined && (
        <span
          aria-hidden
          className={cn("absolute size-3 rotate-45 bg-surface", placement === "right" ? "-left-1.5" : "-top-1.5")}
          style={placement === "right" ? { top: arrow - 6 } : { left: arrow - 6 }}
        />
      )}
      <div key={step.target} className="animate-rise p-4">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-md [&_svg]:size-4", step.tone)}>{step.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-medium text-subtle">{step.chapter}</p>
            <h3 id="tour-step-title" className="truncate text-lg font-semibold tracking-tight text-ink">
              {step.title}
            </h3>
          </div>
          <button type="button" onClick={onSkip} aria-label="Close tour" className="-mt-5 -mr-1.5 grid size-7 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink">
            <X className="size-3.5" />
          </button>
        </div>
        <p id="tour-step-body" className="mt-3 text-sm text-muted">
          {step.body}
        </p>
        {step.bullets && (
          <ul className="mt-3 flex flex-col gap-2 rounded-md bg-raised p-2.5">
            {step.bullets.map((b) => (
              <li key={b.label} className="flex gap-2.5 text-xs">
                <span className="mt-px text-subtle [&_svg]:size-3.5">{b.icon}</span>
                <span>
                  <span className="font-medium text-ink">{b.label}</span>
                  <span className="text-muted"> · {b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-2xs text-subtle tabular">
            {index + 1} of {STEPS.length}
          </span>
          <div className="flex gap-0.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.target} className={cn("h-1 flex-1 rounded-full transition-colors", i <= index ? "bg-ink" : "bg-sunken")} />
            ))}
          </div>
        </div>
        <button type="button" onClick={onSkip} className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
          Skip tour
        </button>
        <button type="button" onClick={onBack} aria-label="Previous step" className={buttonClass("secondary", "sm", "px-2")}>
          <ArrowLeft className="size-3.5" />
        </button>
        <AutoFocusButton key={step.target} onClick={onNext} className={buttonClass("primary", "sm")}>
          {last ? "Finish" : "Next"}
          {last ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
        </AutoFocusButton>
      </div>
    </div>
  );
}

function AutoFocusButton({ onClick, className, children }: { onClick: () => void; className: string; children: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <button ref={ref} type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
