import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { currentUser } from "@/server/context";
import { googleAuthEnabled } from "@/server/env";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signupTitle };
}

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const product = typeof sp.product === "string" ? sp.product.slice(0, 60) : undefined;
  const user = await currentUser();
  if (user && !user.isGuest) redirect(next ?? "/start");

  return (
    <AuthShell variant="signup">
      <AuthForm mode="signup" next={next} product={product} googleEnabled={googleAuthEnabled} />
    </AuthShell>
  );
}
