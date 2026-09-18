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

import type { Dictionary } from "@/i18n/dictionaries";

type NavCopy = Dictionary["marketing"]["nav"];
export type NavItemId = keyof NavCopy["items"];
export type NavColumnId = keyof NavCopy["columns"];
export type NavMenuId = keyof NavCopy["menus"];

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
export type NavItem = { id: NavItemId; href: string; icon: LucideIcon; tone: Tone; soon?: boolean };
export type NavMenu = {
  id: NavMenuId;
  columns: { id: NavColumnId; items: NavItem[] }[];
  featured: { href: string; tone: Tone; spot: "understand" | "decide" | "experiment" | "control" | "learn" };
};

export const NAV: NavMenu[] = [
  {
    id: "product",
    columns: [
      {
        id: "understand",
        items: [
          { id: "productAnalysis", href: "/#uc-analysis", icon: ScanSearch, tone: "blue" },
          { id: "icpPositioning", href: "/#uc-icp", icon: Users, tone: "pink" },
          { id: "competitorMap", href: "/#uc-competitors", icon: Swords, tone: "blue" },
        ],
      },
      {
        id: "decide",
        items: [
          { id: "channelStrategy", href: "/#uc-strategy", icon: Radar, tone: "tangerine" },
          { id: "budgetAllocation", href: "/#uc-budget", icon: Wallet, tone: "sun" },
          { id: "goalsPace", href: "/#pillar-decide", icon: Target, tone: "tangerine" },
        ],
      },
      {
        id: "act",
        items: [
          { id: "kayaAgent", href: "/#control", icon: Sparkles, tone: "lilac" },
          { id: "paidAds", href: "/#uc-ads", icon: Megaphone, tone: "pink" },
          { id: "seoPages", href: "/#uc-seo", icon: FileText, tone: "lilac" },
          { id: "communityLaunches", href: "/#uc-community", icon: MessagesSquare, tone: "tangerine" },
          { id: "lifecycleEmail", href: "/#uc-email", icon: Mail, tone: "blue" },
        ],
      },
      {
        id: "measure",
        items: [
          { id: "experiments", href: "/#uc-experiments", icon: FlaskConical, tone: "grass" },
          { id: "analytics", href: "/#uc-analytics", icon: ChartLine, tone: "grass" },
          { id: "learnings", href: "/#pillar-learn", icon: Brain, tone: "sun" },
          { id: "weeklyBrief", href: "/#uc-brief", icon: Newspaper, tone: "sun" },
        ],
      },
    ],
    featured: { href: "/#control", tone: "lilac", spot: "control" },
  },
  {
    id: "use-cases",
    columns: [
      {
        id: "getCustomers",
        items: [
          { id: "yourFirst100Customers", href: "/use-cases/first-100-customers", icon: Sprout, tone: "grass" },
          { id: "launchOnHnProductHunt", href: "/use-cases/launch-hn-product-hunt", icon: Rocket, tone: "tangerine" },
          { id: "winComparisonSearches", href: "/use-cases/comparison-searches", icon: Search, tone: "blue" },
          { id: "scalePaidSearch", href: "/use-cases/scale-paid-search", icon: TrendingUp, tone: "pink" },
        ],
      },
      {
        id: "growWhatYouHave",
        items: [
          { id: "spendASmallBudgetWell", href: "/use-cases/small-budget", icon: Coins, tone: "sun" },
          { id: "turnTrialsIntoCustomers", href: "/use-cases/turn-trials-into-customers", icon: Repeat, tone: "lilac" },
          { id: "diagnoseASignupsDrop", href: "/use-cases/diagnose-signups-drop", icon: TrendingDown, tone: "tangerine" },
          { id: "knowWhatDroveRevenue", href: "/use-cases/revenue-attribution", icon: ChartLine, tone: "grass" },
        ],
      },
    ],
    featured: { href: "/use-cases", tone: "grass", spot: "experiment" },
  },
  {
    id: "solutions",
    columns: [
      {
        id: "byStage",
        items: [
          { id: "preLaunch", href: "/solutions/pre-launch", icon: Sprout, tone: "grass" },
          { id: "firstRevenue", href: "/solutions/first-revenue", icon: Rocket, tone: "tangerine" },
          { id: "scaling", href: "/solutions/scaling", icon: TrendingUp, tone: "pink" },
        ],
      },
      {
        id: "byProduct",
        items: [
          { id: "b2bSaas", href: "/solutions/b2b-saas", icon: Building2, tone: "blue" },
          { id: "developerTools", href: "/solutions/developer-tools", icon: Code, tone: "lilac" },
          { id: "aiApps", href: "/solutions/ai-apps", icon: Bot, tone: "sun" },
          { id: "mobileApps", href: "/solutions/mobile-apps", icon: Smartphone, tone: "blue" },
        ],
      },
      {
        id: "byTeam",
        items: [
          { id: "soloFounders", href: "/solutions/solo-founders", icon: User, tone: "tangerine" },
          { id: "smallTeams", href: "/solutions/small-teams", icon: Users, tone: "grass" },
          { id: "agencies", href: "/solutions/agencies", icon: Briefcase, tone: "lilac" },
        ],
      },
    ],
    featured: { href: "/solutions", tone: "blue", spot: "decide" },
  },
  {
    id: "resources",
    columns: [
      {
        id: "learn",
        items: [
          { id: "growthPlaybooks", href: "/", icon: BookOpen, tone: "sun", soon: true },
          { id: "kayaAcademy", href: "/", icon: GraduationCap, tone: "blue", soon: true },
          { id: "changelog", href: "/", icon: History, tone: "grass", soon: true },
          { id: "brandGuidelines", href: "/brand", icon: Palette, tone: "pink" },
        ],
      },
      {
        id: "explore",
        items: [
          { id: "demoWorkspace", href: "$demo", icon: CirclePlay, tone: "tangerine" },
          { id: "howAutonomyWorks", href: "/#control", icon: ShieldCheck, tone: "lilac" },
          { id: "faq", href: "/#faq", icon: CircleHelp, tone: "blue" },
        ],
      },
    ],
    featured: { href: "/#pillar-learn", tone: "sun", spot: "learn" },
  },
  {
    id: "company",
    columns: [
      {
        id: "kaya",
        items: [
          { id: "about", href: "/about", icon: Info, tone: "blue" },
          { id: "careers", href: "/", icon: Heart, tone: "pink", soon: true },
          { id: "securityTrust", href: "/#control", icon: ShieldCheck, tone: "lilac" },
          { id: "partners", href: "/", icon: Handshake, tone: "grass", soon: true },
        ],
      },
    ],
    featured: { href: "/brand", tone: "pink", spot: "understand" },
  },
];

export function resolveHref(href: string, demoHref: string) {
  return href === "$demo" ? demoHref : href;
}
