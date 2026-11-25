import type { Metadata } from "next";
import { Suspense } from "react";

import { ProtectedSkeleton } from "@/components/auth/protected-skeleton";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account | Atelier",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<ProtectedSkeleton />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const user = await requireUser("/account");

  return (
    <section className="container-page section-y">
      <div className="stack max-w-xl gap-8">
        <header className="stack gap-3">
          <p className="eyebrow text-muted">My account</p>
          <h1 className="text-display break-words">Welcome, {user.name}</h1>
        </header>
        <dl className="hairline-t stack gap-5 pt-6">
          <div className="stack gap-1">
            <dt className="eyebrow text-muted">Name</dt>
            <dd className="break-words">{user.name}</dd>
          </div>
          <div className="stack gap-1">
            <dt className="eyebrow text-muted">Email</dt>
            <dd className="break-words">{user.email}</dd>
          </div>
        </dl>
        <SignOutButton />
      </div>
      <SessionRefresh />
    </section>
  );
}
