import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/lib/auth";

export type CurrentUser = { id: string; name: string; email: string; role: string };

/**
 * The validated session, or null. Looked up once per render, and never cached
 * across requests, so signing out and role changes apply immediately. Server
 * Components can't set cookies, so extending the session is left to the auth
 * API route (see SessionRefresh).
 */
export const getSession = cache(async () => {
  // Keeps the lookup out of the per-session shells Next prerenders. Those abort
  // the query midway, and the error logs its parameters: the session token.
  await connection();
  return auth.api.getSession({ headers: await headers(), query: { disableRefresh: true } });
});

/**
 * Requires a signed-in user. Call it in every protected page, Server Action and
 * Route Handler before reading or changing data. Layouts don't re-run on
 * navigation and the proxy only checks that a cookie exists, so neither is enough.
 */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  const { id, name, email, role } = session.user;
  return { id, name, email, role };
}

/** Requires an admin. Other signed-in users get the not-found page. */
export async function requireAdmin(returnTo: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") notFound();
  return user;
}
