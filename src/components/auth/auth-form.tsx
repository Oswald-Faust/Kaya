"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { loginAction, signupAction, type AuthFormState } from "@/app/(auth)/actions";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

function Field({ label, name, type = "text", autoComplete, placeholder, hint }: { label: string; name: string; type?: string; autoComplete?: string; placeholder?: string; hint?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className={cn(
            "h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-subtle focus:border-ink focus:shadow-[0_0_0_4px_rgb(11_11_11/0.06)]",
            isPassword && "pr-12",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:bg-sunken hover:text-ink"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-medium text-white transition-colors hover:bg-ink-hover disabled:opacity-70"
    >
      {pending ? <Spinner /> : null}
      {pending ? "One moment…" : label}
      {!pending && <ArrowRight className="size-4" />}
    </button>
  );
}

export function AuthForm({ mode, next, googleEnabled, product, notice }: { mode: "login" | "signup"; next?: string; googleEnabled: boolean; product?: string; notice?: string }) {
  const [state, action] = useActionState<AuthFormState, FormData>(mode === "login" ? loginAction : signupAction, { error: null });
  const query = next ? `?next=${encodeURIComponent(next)}${product ? `&product=${encodeURIComponent(product)}` : ""}` : "";
  const error = state.error ?? notice ?? null;

  return (
    <div>
      {product && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-soft px-3 py-1.5 text-sm text-lime-deep">
          <Sparkles className="size-3.5" /> Your {product} analysis is ready. Save it to continue.
        </p>
      )}
      <h1 className="text-[clamp(34px,3.4vw,46px)] leading-[1.05] font-medium tracking-[-0.04em] text-ink">
        {mode === "login" ? (
          <>
            Welcome back.
            <br />
            Log in to your account.
          </>
        ) : (
          <>
            Create your account.
            <br />
            <span className="text-muted">Start growing in minutes.</span>
          </>
        )}
      </h1>

      {googleEnabled && (
        <>
          <a
            href={`/api/auth/google${query}`}
            className="mt-10 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-surface text-[15px] font-medium text-ink transition-colors hover:bg-raised"
          >
            <GoogleG />
            {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
          </a>
          <div className="my-6 flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form action={action} className={cn("space-y-4", !googleEnabled && "mt-10")}>
        <input type="hidden" name="next" value={next ?? ""} />
        {mode === "signup" && <Field label="Full name" name="name" autoComplete="name" placeholder="Ada Lovelace" />}
        <Field label="Work email" name="email" type="email" autoComplete="email" placeholder="name@company.com" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
        />
        {error && (
          <p role="alert" className="rounded-xl bg-negative-soft px-3 py-2.5 text-sm text-negative">
            {error}
          </p>
        )}
        <Submit label={mode === "login" ? "Log in" : "Create account"} />
      </form>

      <p className="mt-6 text-center text-[15px] text-muted">
        {mode === "login" ? (
          <>
            New to Kaya?{" "}
            <Link href={`/signup${query}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login${query}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
