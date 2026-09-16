import Link from "next/link";
import { and, count, eq, gt } from "drizzle-orm";
import { ArrowUpRight, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/admin/ui";
import { KayaMark } from "@/components/brand/logo";
import { requireAdmin } from "@/server/admin/guard";
import { db } from "@/server/db/client";
import { agentRuns, organizations } from "@/server/db/schema";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

export const metadata = { title: { default: "Admin", template: "%s · Kaya Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [[{ pastDue }], [{ failed }]] = await Promise.all([
    db.select({ pastDue: count() }).from(organizations).where(eq(organizations.planStatus, "past_due")),
    db.select({ failed: count() }).from(agentRuns).where(and(eq(agentRuns.status, "failed"), gt(agentRuns.createdAt, hoursAgo(24)))),
  ]);

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-surface px-3 py-3 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:py-5">
        <div className="mb-3 flex items-center justify-between px-2 lg:mb-6">
          <Link href="/admin" className="flex items-center gap-2">
            <KayaMark className="size-7" />
            <span className="text-[17px] font-medium tracking-[-0.02em]">kaya</span>
            <span className="rounded-md bg-negative px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white uppercase">Admin</span>
          </Link>
        </div>
        <AdminNav badges={{ "/admin/subscriptions": pastDue, "/admin/runs": failed }} />
        <div className="mt-auto hidden space-y-1 border-t border-line pt-4 lg:block">
          <Link href="/" className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted hover:bg-sunken hover:text-ink">
            <ArrowUpRight className="size-4" />
            Back to site
          </Link>
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <Avatar name={admin.name} email={admin.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{admin.name}</p>
              <p className="truncate text-2xs text-muted">{admin.email}</p>
            </div>
            <form action="/logout" method="post">
              <button type="submit" title="Log out" className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink">
                <LogOut className="size-4" />
                <span className="sr-only">Log out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-9">
        <div className="mx-auto max-w-[1240px]">{children}</div>
      </main>
    </div>
  );
}

