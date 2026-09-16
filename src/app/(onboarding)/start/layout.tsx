import Link from "next/link";
import { KayaWordmark } from "@/components/brand/logo";
import { currentUser } from "@/server/context";

// Product analysis runs after the response (crawl, Claude extraction, pricing research).
export const maxDuration = 300;

export default async function OnboardingLayout({ children }: LayoutProps<"/start">) {
  const user = await currentUser();
  return (
    <div className="onboarding-scale min-h-screen bg-canvas">
      <header className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5">
        <Link href="/" aria-label="Kaya home">
          <KayaWordmark className="text-[22px]" markClassName="size-7" />
        </Link>
        {user && !user.isGuest ? (
          <form action="/logout" method="post" className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{user.email}</span>
            <button type="submit" className="rounded-lg px-3 py-1.5 font-medium text-ink hover:bg-sunken">
              Log out
            </button>
          </form>
        ) : (
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink hover:bg-sunken">
            Log in
          </Link>
        )}
      </header>
      {children}
    </div>
  );
}
