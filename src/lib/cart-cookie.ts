import "server-only";

import { cookies } from "next/headers";

import { CART_COOKIE, parseCart, serializeCart, type CartItem } from "@/lib/cart";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function readCart(): Promise<CartItem[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

/** Server Actions only: cookies can't be set while rendering. */
export async function writeCart(items: CartItem[]): Promise<void> {
  const store = await cookies();
  if (items.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, serializeCart(items), {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Readable by the header, so it can show a count on static pages. The
    // cookie holds no prices, names or anything secret.
    httpOnly: false,
  });
}
