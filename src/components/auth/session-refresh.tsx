"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

/**
 * Lets the auth API route extend the session and its cookie, at most once a day
 * (`session.updateAge`). Server Components can't set cookies.
 */
export function SessionRefresh() {
  useEffect(() => {
    authClient.getSession().catch(() => {});
  }, []);
  return null;
}
