const DEFAULT_PATH = "/account";

/**
 * Returns `value` only if it is a path on this site, so a crafted `?next=` link
 * can't send someone to another site after signing in. Resolving it the way a
 * browser does catches forms like `//evil.com`, `/\evil.com` and `/.//evil.com`.
 */
export function safeRedirect(value: string | string[] | null | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/")) return DEFAULT_PATH;
  const base = "http://internal.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base || url.pathname.startsWith("//")) return DEFAULT_PATH;
    return url.pathname + url.search + url.hash;
  } catch {
    return DEFAULT_PATH;
  }
}
