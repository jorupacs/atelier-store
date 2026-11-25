import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-validation";

// Loaded by the Better Auth CLI as well, so don't import "server-only" here.
// Pages and actions read the session through "@/lib/session".
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        // Never accepted from a client. Change roles with `npm run auth:role`.
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // extended at most once a day
    // The cookie cache stays off so that signing out and role changes apply on
    // the next request.
  },
  // Endpoints for features the store doesn't offer yet.
  disabledPaths: [
    "/update-user",
    "/update-session",
    "/change-password",
    "/verify-password",
    "/unlink-account",
    "/sign-in/social",
  ],
  // nextCookies must be the last plugin.
  plugins: [nextCookies()],
});
