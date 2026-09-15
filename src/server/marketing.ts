import "server-only";
import { unstable_rethrow } from "next/navigation";
import { currentUser, listWorkspacesForUser } from "@/server/context";

export interface MarketingLinks {
  appHref: string | null;
  demoHref: string;
  demoSlug: string | null;
}

const FALLBACK: MarketingLinks = { appHref: null, demoHref: "/demo", demoSlug: null };

/**
 * Links for public marketing pages. These pages must render without a database
 * (e.g. a preview deployment), so lookups are bounded and failures fall back to /start.
 */
export async function getMarketingLinks(): Promise<MarketingLinks> {
  try {
    const lookup = (async () => {
      const user = await currentUser();
      if (!user || user.isGuest) return FALLBACK;
      const workspaces = await listWorkspacesForUser(user.userId);
      const demo = workspaces.find((w) => w.isDemo);
      return {
        appHref: workspaces.length ? `/w/${workspaces[workspaces.length - 1].slug}` : null,
        demoHref: demo ? `/w/${demo.slug}` : "/demo",
        demoSlug: demo?.slug ?? null,
      };
    })();
    const timeout = new Promise<MarketingLinks>((resolve) => setTimeout(() => resolve(FALLBACK), 2500));
    return await Promise.race([lookup, timeout]);
  } catch (error) {
    // Let Next.js control-flow errors (dynamic rendering, redirects) through.
    unstable_rethrow(error);
    console.error(JSON.stringify({ level: "warn", msg: "marketing_links_unavailable", error: String(error) }));
    return FALLBACK;
  }
}
