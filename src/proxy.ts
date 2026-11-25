import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends visitors without a session cookie to sign in before anything renders.
 * This only checks that a cookie exists. The real check is requireUser or
 * requireAdmin in each page and action.
 */
export function proxy(request: NextRequest) {
  // Server Actions POST to the page they're on, and can't follow a redirect from
  // here. Their own requireUser or requireAdmin call redirects instead.
  const isNavigation = request.method === "GET" || request.method === "HEAD";
  if (!isNavigation || getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
