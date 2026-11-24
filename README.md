# Atelier Store

Next.js (App Router) + TypeScript + Tailwind CSS + Better Auth + Drizzle ORM + Neon Postgres.

## Setup

Requires Node 20.9+ (`nvm use` reads `.nvmrc`).

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run auth:generate   # generate Better Auth tables into src/db/schema.ts
npm run db:push         # or db:generate + db:migrate
npm run dev
```

## Structure

```
src/
  app/
    api/auth/[...all]/route.ts   Better Auth route handler
  db/
    index.ts                     Drizzle client (Neon HTTP driver)
    schema.ts                    Drizzle schema (empty for now)
  lib/
    auth.ts                      Better Auth server config
    auth-client.ts               Better Auth React client
drizzle.config.ts                drizzle-kit config
```

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `db:generate` / `db:migrate` / `db:push` / `db:studio` | drizzle-kit |
| `auth:generate` | Better Auth CLI schema generation |
