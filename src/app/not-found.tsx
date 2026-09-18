import Link from "next/link";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5">
      <p className="text-xs text-muted">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.common.notFound.title}</h1>
      <p className="mt-2 text-sm text-muted">{t.common.notFound.body}</p>
      <Link href="/" className="mt-5 text-sm text-ink underline underline-offset-4">
        {t.common.notFound.back}
      </Link>
    </main>
  );
}
