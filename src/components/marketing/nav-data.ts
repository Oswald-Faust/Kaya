import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building2,
  ChartLine,
  CircleHelp,
  CirclePlay,
  Code,
  Coins,
  FileText,
  FlaskConical,
  GraduationCap,
  Handshake,
  Heart,
  History,
  Info,
  Mail,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Palette,
  Radar,
  Repeat,
  Rocket,
  ScanSearch,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Tone = "blue" | "tangerine" | "grass" | "lilac" | "sun" | "pink" | "lime";

export const TONE_TILE: Record<Tone, string> = {
  blue: "bg-blue-soft text-blue-deep",
  tangerine: "bg-tangerine-soft text-tangerine-deep",
  grass: "bg-grass-soft text-grass-deep",
  lilac: "bg-lilac-soft text-lilac-deep",
  sun: "bg-sun-soft text-sun-deep",
  pink: "bg-pink-soft text-pink-deep",
  lime: "bg-lime-soft text-lime-deep",
};

export const TONE_CARD: Record<Tone, string> = {
  blue: "bg-blue-soft",
  tangerine: "bg-tangerine-soft",
  grass: "bg-grass-soft",
  lilac: "bg-lilac-soft",
  sun: "bg-sun-soft",
  pink: "bg-pink-soft",
  lime: "bg-lime",
};

/** `$demo` resolves to the demo workspace when one exists. */
export type NavItem = { label: string; desc?: string; href: string; icon: LucideIcon; tone: Tone; soon?: boolean };
export type NavMenu = {
  id: string;
  label: string;
  columns: { title: string; items: NavItem[] }[];
  featured: { kicker: string; title: string; href: string; tone: Tone; spot: "understand" | "decide" | "experiment" | "control" | "learn" };
};

export const NAV: NavMenu[] = [
  {
    id: "product",
    label: "Product",
    columns: [
      {
        title: "Understand",
        items: [
          { label: "Product analysis", href: "/#uc-analysis", icon: ScanSearch, tone: "blue" },
          { label: "ICP & positioning", href: "/#uc-icp", icon: Users, tone: "pink" },
          { label: "Competitor map", href: "/#uc-competitors", icon: Swords, tone: "blue" },
        ],
      },
      {
        title: "Decide",
        items: [
          { label: "Channel strategy", href: "/#uc-strategy", icon: Radar, tone: "tangerine" },
          { label: "Budget allocation", href: "/#uc-budget", icon: Wallet, tone: "sun" },
          { label: "Goals & pace", href: "/#pillar-decide", icon: Target, tone: "tangerine" },
        ],
      },
      {
        title: "Act",
        items: [
          { label: "Kaya agent", href: "/#control", icon: Sparkles, tone: "lilac" },
          { label: "Paid ads", href: "/#uc-ads", icon: Megaphone, tone: "pink" },
          { label: "SEO pages", href: "/#uc-seo", icon: FileText, tone: "lilac" },
          { label: "Community launches", href: "/#uc-community", icon: MessagesSquare, tone: "tangerine" },
          { label: "Lifecycle email", href: "/#uc-email", icon: Mail, tone: "blue" },
        ],
      },
      {
        title: "Measure",
        items: [
          { label: "Experiments", href: "/#uc-experiments", icon: FlaskConical, tone: "grass" },
          { label: "Analytics", href: "/#uc-analytics", icon: ChartLine, tone: "grass" },
          { label: "Learnings", href: "/#pillar-learn", icon: Brain, tone: "sun" },
          { label: "Weekly brief", href: "/#uc-brief", icon: Newspaper, tone: "sun" },
        ],
      },
    ],
    featured: { kicker: "Autopilot", title: "Let Kaya act on its own, inside guardrails you set", href: "/#control", tone: "lilac", spot: "control" },
  },
  {
    id: "use-cases",
    label: "Use cases",
    columns: [
      {
        title: "Get customers",
        items: [
          { label: "Your first 100 customers", desc: "From a URL to a plan and first experiments", href: "/start", icon: Sprout, tone: "grass" },
          { label: "Launch on HN & Product Hunt", desc: "Drafts that respect each community", href: "/#uc-community", icon: Rocket, tone: "tangerine" },
          { label: "Win comparison searches", desc: "Pages for “X alternative” intent", href: "/#uc-seo", icon: Search, tone: "blue" },
          { label: "Scale paid search", desc: "Raise budgets only when CAC holds", href: "/#uc-ads", icon: TrendingUp, tone: "pink" },
        ],
      },
      {
        title: "Grow what you have",
        items: [
          { label: "Spend a small budget well", desc: "Fund tests that can reach significance", href: "/#uc-budget", icon: Coins, tone: "sun" },
          { label: "Turn trials into customers", desc: "Emails triggered by product events", href: "/#uc-email", icon: Repeat, tone: "lilac" },
          { label: "Diagnose a signups drop", desc: "Find the cause before the next sprint", href: "/#uc-brief", icon: TrendingDown, tone: "tangerine" },
          { label: "Know what drove revenue", desc: "Channel CAC with every formula shown", href: "/#uc-analytics", icon: ChartLine, tone: "grass" },
        ],
      },
    ],
    featured: { kicker: "Demo workspace", title: "How Tickwarden lifted trial starts 31%", href: "$demo", tone: "grass", spot: "experiment" },
  },
  {
    id: "solutions",
    label: "Solutions",
    columns: [
      {
        title: "By stage",
        items: [
          { label: "Pre-launch", href: "/pricing#plan-free", icon: Sprout, tone: "grass" },
          { label: "First revenue", href: "/pricing#plan-launch", icon: Rocket, tone: "tangerine" },
          { label: "Scaling", href: "/pricing#plan-growth", icon: TrendingUp, tone: "pink" },
        ],
      },
      {
        title: "By product",
        items: [
          { label: "B2B SaaS", href: "/start", icon: Building2, tone: "blue" },
          { label: "Developer tools", href: "$demo", icon: Code, tone: "lilac" },
          { label: "AI apps", href: "/start", icon: Bot, tone: "sun" },
          { label: "Mobile apps", href: "/start", icon: Smartphone, tone: "blue", soon: true },
        ],
      },
      {
        title: "By team",
        items: [
          { label: "Solo founders", href: "/pricing#plan-launch", icon: User, tone: "tangerine" },
          { label: "Small teams", href: "/pricing#plan-growth", icon: Users, tone: "grass" },
          { label: "Agencies", href: "/start", icon: Briefcase, tone: "lilac", soon: true },
        ],
      },
    ],
    featured: { kicker: "Pricing", title: "Start free. Pay as Kaya does more", href: "/pricing", tone: "blue", spot: "decide" },
  },
  {
    id: "resources",
    label: "Resources",
    columns: [
      {
        title: "Learn",
        items: [
          { label: "Growth playbooks", href: "/", icon: BookOpen, tone: "sun", soon: true },
          { label: "Kaya Academy", href: "/", icon: GraduationCap, tone: "blue", soon: true },
          { label: "Changelog", href: "/", icon: History, tone: "grass", soon: true },
          { label: "Brand guidelines", href: "/brand", icon: Palette, tone: "pink" },
        ],
      },
      {
        title: "Explore",
        items: [
          { label: "Demo workspace", href: "$demo", icon: CirclePlay, tone: "tangerine" },
          { label: "How autonomy works", href: "/#control", icon: ShieldCheck, tone: "lilac" },
          { label: "FAQ", href: "/#faq", icon: CircleHelp, tone: "blue" },
        ],
      },
    ],
    featured: { kicker: "Learn", title: "Every result makes next month smarter", href: "/#pillar-learn", tone: "sun", spot: "learn" },
  },
  {
    id: "company",
    label: "Company",
    columns: [
      {
        title: "Kaya",
        items: [
          { label: "About", href: "/about", icon: Info, tone: "blue" },
          { label: "Careers", href: "/", icon: Heart, tone: "pink", soon: true },
          { label: "Security & trust", href: "/#control", icon: ShieldCheck, tone: "lilac" },
          { label: "Partners", href: "/", icon: Handshake, tone: "grass", soon: true },
        ],
      },
    ],
    featured: { kicker: "Brand", title: "The Kaya identity: logo, palette, type and clay", href: "/brand", tone: "pink", spot: "understand" },
  },
];

export function resolveHref(href: string, demoHref: string) {
  return href === "$demo" ? demoHref : href;
}
