/**
 * Which first-visit tour belongs to which workspace route. Shared by the shell,
 * which opens the tour, and the server action that records it as seen.
 */
export const PAGE_TOUR_KEYS = [
  "command",
  "kai",
  "agent",
  "run",
  "strategy",
  "experiments",
  "experiment",
  "learnings",
  "analytics",
  "memory",
  "campaigns",
  "content",
  "seo",
  "creators",
  "integrations",
  "settings",
] as const;

export type PageTourKey = (typeof PAGE_TOUR_KEYS)[number];

const SECTION: Record<string, PageTourKey> = {
  kai: "kai",
  agent: "agent",
  strategy: "strategy",
  experiments: "experiments",
  learnings: "learnings",
  analytics: "analytics",
  memory: "memory",
  campaigns: "campaigns",
  content: "content",
  seo: "seo",
  creators: "creators",
  integrations: "integrations",
  settings: "settings",
};

export function isPageTourKey(value: string): value is PageTourKey {
  return (PAGE_TOUR_KEYS as readonly string[]).includes(value);
}

/** `/w/acme/experiments/12` → "experiment"; routes without a tour → null. */
export function pageTourKey(pathname: string): PageTourKey | null {
  const parts = pathname.split("?")[0].split("/").filter(Boolean);
  if (parts[0] !== "w" || !parts[1]) return null;
  const [section, detail] = parts.slice(2);
  if (!section) return "command";
  const key = SECTION[section];
  if (!key) return null;
  if (detail && key === "agent") return "run";
  if (detail && key === "experiments") return "experiment";
  if (detail && key !== "settings") return null;
  return key;
}
