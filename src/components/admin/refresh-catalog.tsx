"use client";

import { useActionState } from "react";

import { refreshCatalog, type RefreshState } from "@/app/admin/actions";

const initialState: RefreshState = { refreshed: false };

export function RefreshCatalog() {
  const [state, action, pending] = useActionState(refreshCatalog, initialState);

  return (
    <form action={action} className="stack items-start gap-3">
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Refreshing…" : "Refresh catalog"}
      </button>
      <p role="status" className="text-body-sm text-muted">
        {state.refreshed && !pending && "The storefront now shows the latest catalog."}
      </p>
    </form>
  );
}
