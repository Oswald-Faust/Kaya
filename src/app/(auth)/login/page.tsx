import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { currentUser } from "@/server/context";
import { googleAuthEnabled } from "@/server/env";

export const metadata: Metadata = { title: "Log in" };

const NOTICES: Record<string, string> = {
  google: "Google sign-in didn't complete. Try again or use your email.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const product = typeof sp.product === "string" ? sp.product.slice(0, 60) : undefined;
  const user = await currentUser();
  if (user && !user.isGuest) redirect(next ?? "/start");

  return (
    <AuthShell variant="login">
      <AuthForm mode="login" next={next} product={product} googleEnabled={googleAuthEnabled} notice={typeof sp.error === "string" ? NOTICES[sp.error] : undefined} />
    </AuthShell>
  );
}
