import type { Metadata } from "next";
import { Suspense } from "react";

import { RefreshCatalog } from "@/components/admin/refresh-catalog";
import { ProtectedSkeleton } from "@/components/auth/protected-skeleton";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAdmin } from "@/lib/session";

// Neutral on purpose: metadata is sent before the role is checked.
export const metadata: Metadata = {
  title: "Atelier",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<ProtectedSkeleton />}>
      <Admin />
    </Suspense>
  );
}

async function Admin() {
  const user = await requireAdmin("/admin");

  return (
    <section className="container-page section-y">
      <div className="stack max-w-xl gap-8">
        <header className="stack gap-3">
          <p className="eyebrow text-muted">Admin</p>
          <h1 className="text-display">Store admin</h1>
          <p className="break-words text-muted">Signed in as {user.email}</p>
        </header>
        <div className="hairline-t stack gap-4 pt-6">
          <h2 className="text-heading-sm">Catalog</h2>
          <p className="text-muted">
            Product changes appear within about a minute. Refresh to show them now.
          </p>
          <RefreshCatalog />
        </div>
        <SignOutButton />
      </div>
      <SessionRefresh />
    </section>
  );
}
