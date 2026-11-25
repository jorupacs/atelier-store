/**
 * Verifies the auth flows against a running local server.
 *
 *   npm run test:auth
 *   BASE_URL=http://localhost:3918 EXPECT_RATE_LIMIT=1 npm run test:auth   # production build
 *
 * The server must use the database in .env. Creates uniquely named accounts and
 * deletes exactly those at the end.
 */

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { eq, inArray, like } from "drizzle-orm";

import { db } from "../src/db";
import { session, user } from "../src/db/schema";
import { safeRedirect } from "../src/lib/safe-redirect";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(BASE).hostname), "Local servers only");

const RUN = `auth-check+${Date.now()}`;
const PASSWORD = "correct horse battery";
const emailFor = (name: string) => `${RUN}-${name}@example.com`;
const createdIds: string[] = [];

after(async () => {
  const rows = await db.select({ id: user.id }).from(user).where(like(user.email, `${RUN}-%`));
  const ids = [...new Set([...createdIds, ...rows.map((r) => r.id)])];
  if (ids.length) await db.delete(user).where(inArray(user.id, ids));
  const left = await db.select({ id: user.id }).from(user).where(like(user.email, `${RUN}-%`));
  console.log(`Deleted ${ids.length} test accounts, ${left.length} left`);
  assert.equal(left.length, 0);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(
  path: string,
  body: unknown,
  { cookie, origin = BASE }: { cookie?: string; origin?: string } = {},
  retry = true,
): Promise<Response> {
  const res = await fetch(`${BASE}/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...(cookie && { cookie }) },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  if (res.status === 429 && retry) {
    await wait(11_000);
    return api(path, body, { cookie, origin }, retry);
  }
  return res;
}

const page = async (path: string, cookie?: string) => {
  const res = await fetch(BASE + path, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
};

const cookieOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .find((c) => c.includes("session_token=")) ?? "";

async function signUp(name: string, extra: object = {}) {
  const res = await api("/sign-up/email", {
    name: `Check ${name}`,
    email: emailFor(name),
    password: PASSWORD,
    ...extra,
  });
  const body = await res.json();
  if (body.user?.id) createdIds.push(body.user.id);
  return { res, body, cookie: cookieOf(res), id: body.user?.id as string };
}

const setRole = (id: string, role: string) => db.update(user).set({ role }).where(eq(user.id, id));
const ADMIN_TEXT = /Store admin|Refresh catalog/;
/** A redirect thrown after streaming starts is delivered inside the 200 response. */
const redirectsToSignIn = (html: string) => /\/sign-in\?next=/.test(html);

test("anonymous visitors are redirected before rendering", async () => {
  for (const path of ["/account", "/account/orders", "/admin", "/admin/products"]) {
    const { status, location } = await page(path);
    assert.equal(status, 307, path);
    const url = new URL(location!, BASE);
    assert.equal(url.pathname, "/sign-in");
    assert.equal(url.searchParams.get("next"), path);
  }
  for (const path of ["/", "/search", "/collections/jewelry", "/sign-in", "/sign-up"]) {
    assert.equal((await page(path)).status, 200, path);
  }
});

test("a forged cookie gets past the proxy but not the page", async () => {
  const forged = "better-auth.session_token=forged.AAAA; __Secure-better-auth.session_token=forged.AAAA";
  const account = await page("/account", forged);
  assert.ok(redirectsToSignIn(account.html));
  assert.doesNotMatch(account.html, /Welcome, /);
  const admin = await page("/admin", forged);
  assert.ok(redirectsToSignIn(admin.html));
  assert.doesNotMatch(admin.html, ADMIN_TEXT);
  // No loop: the sign-in page still shows its form.
  const signIn = await page("/sign-in?next=/account", forged);
  assert.equal(signIn.status, 200);
  assert.match(signIn.html, /name="password"/);
});

test("sign up creates a persistent, protected session", async () => {
  const { res, cookie, body } = await signUp("signup");
  assert.equal(res.status, 200);
  assert.equal(body.user.role, "customer");
  const header = res.headers.getSetCookie().find((c) => c.includes("session_token="))!;
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  const maxAge = Number(/Max-Age=(\d+)/i.exec(header)![1]);
  assert.equal(maxAge, 60 * 60 * 24 * 30);
  const account = await page("/account", cookie);
  assert.match(account.html, new RegExp(emailFor("signup").replace(/[+.]/g, "\\$&")));
  assert.ok(!account.html.includes(decodeURIComponent(cookie.split("=")[1]).split(".")[0]), "no token in HTML");
});

test("clients cannot choose their role", async () => {
  const { id, body } = await signUp("promote", { role: "admin" });
  assert.equal(body.user?.role, "customer");
  const row = await db.query.user.findFirst({ where: eq(user.id, id) });
  assert.equal(row?.role, "customer");
});

test("invalid sign ups and sign ins are rejected", async () => {
  await signUp("dupe");
  assert.equal((await signUp("dupe")).res.status, 422);
  assert.equal((await signUp("short", { password: "short" })).res.status, 400);
  const wrong = await api("/sign-in/email", { email: emailFor("dupe"), password: "wrong password" });
  const unknown = await api("/sign-in/email", { email: emailFor("nobody"), password: "wrong password" });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await wrong.json(), await unknown.json());
});

test("sign in works, and a signed-in visitor skips the sign-in page", async () => {
  await signUp("signin");
  const res = await api("/sign-in/email", { email: emailFor("signin"), password: PASSWORD });
  assert.equal(res.status, 200);
  const cookie = cookieOf(res);
  assert.match((await page("/account", cookie)).html, /Welcome, /);
  const { html } = await page("/sign-in?next=/account", cookie);
  assert.doesNotMatch(html, /name="password"/);
});

test("admin page: customer blocked, admin allowed, demotion immediate", async () => {
  const { id, cookie } = await signUp("admin");
  const blocked = await page("/admin", cookie);
  assert.doesNotMatch(blocked.html, ADMIN_TEXT);
  assert.match(blocked.html, /noindex/);
  await setRole(id, "admin");
  assert.match((await page("/admin", cookie)).html, ADMIN_TEXT);
  await setRole(id, "customer");
  assert.doesNotMatch((await page("/admin", cookie)).html, ADMIN_TEXT);
});

test("admin action checks the role itself", async () => {
  const admin = await signUp("action-admin");
  const customer = await signUp("action-customer");
  await setRole(admin.id, "admin");
  const { html } = await page("/admin", admin.cookie);
  const actionId = /(?:&quot;|\\?")id(?:&quot;|\\?"):(?:&quot;|\\?")([0-9a-f]{40,})/.exec(html)?.[1];
  assert.ok(actionId, "action id found on the admin page");

  const call = async (path: string, cookie?: string) => {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: {
        "next-action": actionId,
        "content-type": "text/plain;charset=UTF-8",
        origin: BASE,
        ...(cookie && { cookie }),
      },
      body: '[{"refreshed":false},null]',
      redirect: "manual",
    });
    return { status: res.status, text: await res.text() };
  };
  const ran = (text: string) => /"refreshed":true/.test(text);

  // Both paths reach the action for an admin, so "didn't run" below means refused.
  for (const path of ["/admin", "/sign-up"]) {
    assert.ok(ran((await call(path, admin.cookie)).text), `admin can run it on ${path}`);
  }
  // Posting to a public page skips the proxy, so only the action's check applies.
  for (const path of ["/admin", "/sign-up"]) {
    const asCustomer = await call(path, customer.cookie);
    assert.ok(!ran(asCustomer.text), `customer blocked on ${path}`);
    assert.match(asCustomer.text, /NEXT_HTTP_ERROR_FALLBACK;404/, `refused on ${path}`);
  }
  for (const path of ["/admin", "/sign-up"]) {
    assert.ok(!ran((await call(path)).text), `anonymous blocked on ${path}`);
  }
  await setRole(admin.id, "customer");
  assert.ok(!ran((await call("/admin", admin.cookie)).text), "demoted admin blocked");
});

test("sign out ends the session, and the old cookie stops working", async () => {
  const { id, cookie } = await signUp("signout");
  assert.equal((await api("/sign-out", {}, { cookie })).status, 200);
  assert.equal((await db.select().from(session).where(eq(session.userId, id))).length, 0);
  const replay = await page("/account", cookie);
  assert.ok(redirectsToSignIn(replay.html));
  assert.doesNotMatch(replay.html, /Welcome, /);
});

test("an expired session is rejected", async () => {
  const { id, cookie } = await signUp("expired");
  await db.update(session).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(session.userId, id));
  const { html } = await page("/account", cookie);
  assert.ok(redirectsToSignIn(html));
  assert.doesNotMatch(html, /Welcome, /);
});

test("an ageing session is extended through the API route", async () => {
  const { id, cookie } = await signUp("refresh");
  const soon = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
  await db.update(session).set({ expiresAt: soon }).where(eq(session.userId, id));
  const expiry = async () =>
    (await db.select().from(session).where(eq(session.userId, id)))[0].expiresAt.getTime();
  await page("/account", cookie);
  assert.equal(await expiry(), soon.getTime(), "a page render doesn't extend it");
  const res = await fetch(`${BASE}/api/auth/get-session`, { headers: { cookie } });
  assert.match(cookieOf(res), /session_token=/, "cookie renewed");
  assert.ok((await expiry()) > Date.now() + 29 * 24 * 60 * 60 * 1000, "row extended");
});

test("unused endpoints and cross-site requests are refused", async () => {
  const { cookie } = await signUp("misc");
  for (const path of ["/update-user", "/change-password", "/update-session", "/sign-in/social"]) {
    assert.equal((await api(path, { name: "x", role: "admin" }, { cookie })).status, 404, path);
  }
  const credentials = { email: emailFor("misc"), password: PASSWORD };
  assert.equal((await api("/sign-in/email", credentials, { cookie, origin: "https://evil.example" })).status, 403);
  assert.equal((await api("/sign-out", {}, { cookie, origin: "https://evil.example" })).status, 403);
  assert.match((await page("/account", cookie)).html, /Welcome, /, "still signed in");
});

test("next is limited to paths on this site", () => {
  for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "/\t/evil.com", "/.//evil.com", "/%2e//evil.com", "javascript:alert(1)", "", null, ["/a"]]) {
    assert.equal(safeRedirect(bad), "/account", JSON.stringify(bad));
  }
  assert.equal(safeRedirect("/search?q=a b#x"), "/search?q=a%20b#x");
});

test("rapid sign-in attempts are limited", { skip: !process.env.EXPECT_RATE_LIMIT }, async () => {
  await wait(11_000);
  const statuses: number[] = [];
  for (let i = 0; i < 5; i++) {
    const body = { email: emailFor("nobody"), password: "wrong password" };
    statuses.push((await api("/sign-in/email", body, {}, false)).status);
  }
  assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
});
