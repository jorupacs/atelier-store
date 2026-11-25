# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js 16 is newer than most training data. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/` (for example, middleware is now called "proxy": `01-app/01-getting-started/16-proxy.md`).

## Environment

- Requires Node 20.9+. The machine's default `node` may be older, so run `nvm use` (`.nvmrc` pins 24) or prefix commands with `PATH=~/.nvm/versions/node/v24.22.2/bin:$PATH`.
- Copy `.env.example` to `.env`. `src/db/index.ts` throws at import time if `DATABASE_URL` is unset, so `next build` needs it set. The build also queries products (`generateStaticParams` and prerendering), so it needs a real database that has been migrated and seeded.

## Commands

```bash
npm run dev            # Next dev server (Turbopack)
npm run build          # production build
npm run lint           # ESLint (flat config, eslint-config-next)
npm run typecheck      # tsc --noEmit
npm run auth:generate  # Better Auth CLI: regenerates src/db/auth-schema.ts (keep its version equal to better-auth's)
npm run auth:role      # -- <email> <customer|admin> [--yes]: the only way to change a role
npm run test:cart      # verify cart rules and /bag against a running local server (creates and deletes test products)
npm run test:auth      # verify auth flows against a running local server (creates and deletes test accounts)
npm run db:generate    # drizzle-kit: create a SQL migration in ./drizzle
npm run db:migrate     # apply migrations
npm run db:push        # push the schema directly (no migration files)
npm run db:studio      # Drizzle Studio
npm run db:seed        # upsert sample categories, products and stock (idempotent)
```

There is no test framework yet, apart from `test:auth` and `test:cart`, which use Node's test runner.

## Architecture

Single Next.js App Router app (TypeScript, Tailwind v4, `src/` dir, `@/*` → `src/*`). The storefront has a homepage, collection, search and product pages, plus `/bag`, sign-in, sign-up, `/account` and `/admin`. Products come from Postgres. Checkout and orders don't exist yet.

Data/auth chain, all server-side:

- `src/db/schema.ts` is the single Drizzle schema. It defines `categories`, `products` and `product_stock`: one stock row per product and size, where `size` is null for one-size items. Both the runtime client and drizzle-kit (`drizzle.config.ts`) read it, and Better Auth's adapter receives it too. New tables go here, or in modules re-exported from here. The Better Auth tables are in the generated `src/db/auth-schema.ts`: don't edit it.
- `src/db/index.ts` exports `db`, which is Drizzle on the Neon **HTTP** driver (`drizzle-orm/neon-http`). The HTTP driver has no interactive transactions. Switch to `neon-serverless` (WebSocket Pool) if you need them.
- `src/db/queries/products.ts` holds all product reads, cached with `"use cache"`, `cacheLife("minutes")` and `cacheTag("products")`. It maps rows to the `Product` type and derives `stock` (the sum of quantities) and `sizes` (available when quantity > 0). `src/lib/products.ts` holds only types and `getStockState`, and it must stay free of DB imports because client components import it.
- `src/db/seed.ts` holds the sample catalog. It runs in one `db.batch`.
- `src/lib/auth.ts` exports `auth`, the Better Auth instance: `drizzleAdapter(db, { provider: "pg", schema })`, email/password enabled, a `role` field on users (`customer` or `admin`, never accepted from clients), 30-day sessions, and `nextCookies()` (keep it the last plugin). It must not import `server-only`, because the CLI loads it. It reads `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from the environment.
- `src/app/api/auth/[...all]/route.ts` mounts all `/api/auth/*` endpoints through `toNextJsHandler(auth)`.
- `src/lib/auth-client.ts` exports `authClient` (`better-auth/react`) for client components, using `NEXT_PUBLIC_APP_URL` as its base URL.

### Cart

- The cart is a cookie (`src/lib/cart-cookie.ts`) holding only product id, size and quantity. It needs no account. It is editable by the customer, so `parseCart` validates it and nothing in it affects price.
- `src/db/queries/cart.ts` reads current prices and stock and is never cached. `buildCart` in `src/lib/cart.ts` (pure, client-safe) works out line status and the subtotal in integer cents, counting only units in stock.
- Stock is checked per product **and size**. Identify a line by `productId` + `size`: the seed recreates `product_stock` rows, so their ids change.
- `src/app/bag/actions.ts` takes untyped arguments and parses them. Never accept a price. Lines are never changed silently: an over-stock or unavailable line stays visible with a message.
- The cart reserves nothing. Checkout must re-check stock, refuse carts with `hasIssues`, and decrement atomically.
- The header count reads the cookie in the browser (`useCartCount`) so that static pages stay static. Call `notifyCartChange()` after a cart action.

### Protecting routes and actions

- `src/lib/session.ts` is the authorization layer. Every protected page, Server Action and Route Handler calls `requireUser(path)` or `requireAdmin(path)` itself, before touching data. Don't rely on a layout (it doesn't re-run on navigation) or on the proxy.
- `src/proxy.ts` only redirects visitors without a session cookie, so they get a real 307. It ignores non-GET requests, because Server Actions can't follow its redirect.
- Protected content sits behind `<Suspense>`. Its fallback and the page metadata are sent before the check, so keep them free of private content. A redirect or not-found from the page arrives in a 200 response.
- Don't cache sessions (`use cache`, `use cache: private`, cookie cache), and keep `connection()` in `getSession`: without it, aborted background renders log session tokens.
- Sign-in and sign-up call `authClient`, not Server Actions, because Better Auth's rate limits only apply to its HTTP endpoints. Pass `?next=` values through `safeRedirect`.

`next.config.ts` enables `cacheComponents` and `partialPrefetching` (Next 16 defaults from create-next-app) and wires Tailwind through the `@tailwindcss/turbopack` loader.

## Design system

There is no `tailwind.config` file because this is Tailwind v4. The whole design system lives in `src/app/globals.css`:
- `@theme` tokens: colors such as `ink`, `paper`, `canvas`, `muted` and `line`; type sizes such as `text-label` and `text-display`; `font-display`; and `max-w-page`.
- Responsive `:root` variables: `--gutter`, `--section-y`, `--header-h` and the grid gaps.
- `@utility` primitives: `container-page`, `section-y`, `grid-products`, `eyebrow`, `media-product`, `hairline`.
- `@layer components` classes: `.btn` with `.btn-primary`, `.btn-secondary` and the other variants, plus `.link`.

Use these tokens and classes instead of raw hex values or ad-hoc spacing. Corners are square, borders are 1px hairlines, and the theme is light only. Fonts are loaded in `src/app/layout.tsx`: Geist for the UI and Cormorant Garamond for display text.

drizzle-kit runs outside Next, so `drizzle.config.ts` loads `.env` itself through `dotenv/config`.
