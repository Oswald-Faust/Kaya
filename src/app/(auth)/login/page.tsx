import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { currentUser } from "@/server/context";
import { resolvePostLoginRedirect } from "@/server/services/account";
import { googleAuthEnabled } from "@/server/env";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.loginTitle };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const product = typeof sp.product === "string" ? sp.product.slice(0, 60) : undefined;
  const user = await currentUser();
  if (user && !user.isGuest) {
    redirect(await resolvePostLoginRedirect(user.userId, next));
  }

  return (
    <AuthShell variant="login">
      <AuthForm mode="login" next={next} product={product} googleEnabled={googleAuthEnabled} notice={sp.error === "google" ? (await getI18n()).t.auth.googleError : undefined} />
    </AuthShell>
  );
}
