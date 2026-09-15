import Link from "next/link";
import { Logo } from "@/components/onboarding/logo";

export default function OnboardingLayout({ children }: LayoutProps<"/start">) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex h-14 items-center justify-between px-5">
        <Link href="/" aria-label="Kaya home">
          <Logo />
        </Link>
      </header>
      {children}
    </div>
  );
}
