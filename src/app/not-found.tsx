import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5">
      <p className="text-xs text-muted">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Not found, or not yours</h1>
      <p className="mt-2 text-sm text-muted">This page doesn&apos;t exist, or it belongs to a workspace you don&apos;t have access to.</p>
      <Link href="/" className="mt-5 text-sm text-ink underline underline-offset-4">
        Back to your workspace
      </Link>
    </main>
  );
}
