import { redirect } from "next/navigation";
import { Suspense } from "react";

import { fieldsFor, type AuthMode } from "@/lib/auth-validation";
import { safeRedirect } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";
import { AuthForm } from "./auth-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  mode: AuthMode;
  title: string;
  description: string;
  searchParams: SearchParams;
};

/** Shared sign-in and sign-up layout: static heading, form behind Suspense. */
export function AuthPage({ mode, title, description, searchParams }: Props) {
  return (
    <section className="container-page section-y">
      <div className="mx-auto stack max-w-md gap-8">
        <header className="stack items-center gap-3 text-center">
          <p className="eyebrow text-muted">Account</p>
          <h1 className="text-display">{title}</h1>
          <p className="text-muted">{description}</p>
        </header>
        <Suspense fallback={<AuthFormSkeleton mode={mode} />}>
          <AuthFormLoader mode={mode} searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function AuthFormLoader({ mode, searchParams }: Pick<Props, "mode" | "searchParams">) {
  const next = safeRedirect((await searchParams).next);
  // Checks the session itself: a stale cookie must still reach the form.
  if (await getSession()) redirect(next);
  return <AuthForm mode={mode} next={next} />;
}

/** Same footprint as the form, so nothing moves when it arrives. */
function AuthFormSkeleton({ mode }: { mode: AuthMode }) {
  return (
    <div className="stack gap-6" aria-busy="true">
      <div className="stack gap-5">
        {fieldsFor(mode).map((field) => (
          <div key={field} className="stack gap-2">
            <div className="h-4 w-20 animate-pulse bg-canvas" />
            <div className="h-12 animate-pulse bg-canvas" />
            <div className="h-5" />
          </div>
        ))}
        <div className="h-12 animate-pulse bg-canvas" />
      </div>
      <div className="h-[1.4rem]" />
      <span className="sr-only">Loading form</span>
    </div>
  );
}
