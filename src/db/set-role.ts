/**
 * Changes an account's role. This is the only way to create an admin.
 *
 *   npm run auth:role -- <email> <customer|admin> [--yes]
 *
 * Emails aren't verified, so anyone can register any address. Without --yes it
 * only shows the account: check that it belongs to the right person first.
 */

import { eq } from "drizzle-orm";

import { db } from "./index";
import { user } from "./schema";

const ROLES = ["customer", "admin"];

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes");
  const [email, role] = args.filter((a) => a !== "--yes");
  if (!email || !ROLES.includes(role)) {
    throw new Error("Usage: npm run auth:role -- <email> <customer|admin> [--yes]");
  }

  const account = await db.query.user.findFirst({ where: eq(user.email, email.toLowerCase()) });
  if (!account) throw new Error(`No account uses ${email}.`);

  console.log(`Name:    ${account.name}`);
  console.log(`Email:   ${account.email}`);
  console.log(`Created: ${account.createdAt.toISOString()}`);
  console.log(`Role:    ${account.role} -> ${role}`);

  if (!confirmed) {
    console.log("\nNothing changed. Add --yes to apply.");
    return;
  }
  await db.update(user).set({ role }).where(eq(user.id, account.id));
  console.log("\nDone. It applies on the account's next request.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
