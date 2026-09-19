import "server-only";
import { unstable_rethrow } from "next/navigation";
import { eq } from "drizzle-orm";
import { currentUser, listWorkspacesForUser } from "@/server/context";
import { db } from "@/server/db/client";
import { organizations } from "@/server/db/schema";
import { resolvePlanState, type PlanId } from "@/server/domain/billing/plan-state";
import { type UserSubscriptionSummary } from "@/components/pricing/plans";

export type { UserSubscriptionSummary };

export interface MarketingLinks {
  appHref: string | null;
  demoHref: string;
  demoSlug: string | null;
  subscription: UserSubscriptionSummary | null;
}

const FALLBACK: MarketingLinks = { appHref: null, demoHref: "/demo", demoSlug: null, subscription: null };

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
      const primaryWorkspace = workspaces.find((w) => !w.isDemo) ?? workspaces[workspaces.length - 1];

      let subscription: UserSubscriptionSummary | null = null;
      if (primaryWorkspace) {
        try {
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, primaryWorkspace.organizationId),
          });
          if (org) {
            const planState = resolvePlanState(org);
            if (planState.plan !== "none") {
              subscription = {
                plan: planState.plan,
                status: planState.status,
                workspaceSlug: primaryWorkspace.slug,
                workspaceName: primaryWorkspace.name,
                trialDaysLeft: planState.trialDaysLeft,
                billingManaged: Boolean(org.stripeSubscriptionId),
              };
            }
          }
        } catch {
          // Keep subscription optional if organization query fails
        }
      }

      return {
        appHref: workspaces.length ? `/w/${workspaces[workspaces.length - 1].slug}` : "/start",
        demoHref: demo ? `/w/${demo.slug}` : "/demo",
        demoSlug: demo?.slug ?? null,
        subscription,
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
