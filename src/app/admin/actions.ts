"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/session";

export type RefreshState = { refreshed: boolean };

/** Shows catalog changes right away instead of when the cache expires. */
export async function refreshCatalog(): Promise<RefreshState> {
  // Server Actions can be called without visiting /admin, so check here too.
  await requireAdmin("/admin");
  updateTag("products");
  return { refreshed: true };
}
