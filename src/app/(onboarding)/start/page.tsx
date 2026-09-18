import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StartForm } from "@/components/onboarding/start-form";
import { currentUser, listWorkspacesForUser } from "@/server/context";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.start.metaTitle };
}

export default async function StartPage() {
  const user = await currentUser();
  const workspaces = user ? await listWorkspacesForUser(user.userId) : [];
  const demo = workspaces.find((w) => w.isDemo);
  const { t } = await getI18n();
  const st = t.onboarding.start;

  return (
    <main className="mx-auto flex max-w-2xl flex-col px-5 pt-[12vh] pb-16">
      <p className="text-xs font-medium text-agent">{st.eyebrow}</p>
      <h1 className="mt-3 text-display font-semibold tracking-[-0.02em] text-ink">{st.title}</h1>
      <p className="mt-3 max-w-lg text-lg text-muted">
        {st.lead}
      </p>

      <StartForm />

      <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {st.how.map(({ title, body }, i) => (
          <li key={title} className="bg-surface px-4 py-3.5">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <span className="grid size-5 place-items-center rounded-full bg-sunken text-2xs text-muted tabular">{i + 1}</span>
              {title}
            </p>
            <p className="mt-1 text-xs text-muted">{body}</p>
          </li>
        ))}
      </ol>

      {workspaces.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {demo && (
            <Link href={`/w/${demo.slug}`} className="inline-flex items-center gap-1 text-muted hover:text-ink">
              {fmt(st.exploreDemo, { name: demo.name })} <ArrowRight className="size-3.5" />
            </Link>
          )}
          {workspaces
            .filter((w) => !w.isDemo)
            .slice(-3)
            .map((w) => (
              <Link key={w.slug} href={`/w/${w.slug}`} className="text-muted hover:text-ink">
                {w.name}
              </Link>
            ))}
        </div>
      )}
    </main>
  );
}
