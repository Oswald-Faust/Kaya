import Link from "next/link";
import { KayaWordmark } from "@/components/brand/logo";
import { currentUser } from "@/server/context";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { getI18n } from "@/i18n/server";

// Product analysis runs after the response (crawl, Claude extraction, pricing research).
export const maxDuration = 300;

export default async function OnboardingLayout({ children }: LayoutProps<"/start">) {
  const [user, { t }] = await Promise.all([currentUser(), getI18n()]);
  return (
    <div className="onboarding-scale min-h-screen bg-canvas">
      <header className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5">
        <Link href="/" aria-label={t.marketing.chrome.home}>
          <KayaWordmark className="text-[22px]" markClassName="size-7" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user && !user.isGuest ? (
            <form action="/logout" method="post" className="flex items-center gap-3 text-sm text-muted">
              <span className="hidden sm:inline">{user.email}</span>
              <button type="submit" className="rounded-lg px-3 py-1.5 font-medium text-ink hover:bg-sunken">
                {t.onboarding.logOut}
              </button>
            </form>
          ) : (
            <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink hover:bg-sunken">
              {t.onboarding.logIn}
            </Link>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
