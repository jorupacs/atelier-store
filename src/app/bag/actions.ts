"use server";

import { getAvailable } from "@/db/queries/cart";
import { isSameVariant, MAX_LINES, MAX_QUANTITY, parseQuantity, parseVariant } from "@/lib/cart";
import { readCart, writeCart } from "@/lib/cart-cookie";

export type CartResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): CartResult => ({ ok: false, error });

// Arguments come from the browser, so they're untyped until parsed. Prices are
// never accepted: the bag reads them from the database.

/** Adds one unit. */
export async function addToCart(productId: unknown, size: unknown): Promise<CartResult> {
  const variant = parseVariant(productId, size);
  if (!variant) return fail("This item isn't available.");

  const available = await getAvailable(variant);
  if (available === null) return fail("This item isn't available in that size.");
  if (available === 0) return fail("This item has just sold out.");

  const items = await readCart();
  const line = items.find((i) => isSameVariant(i, variant));
  const quantity = (line?.quantity ?? 0) + 1;
  if (quantity > available) {
    return fail(
      available === 1
        ? "The last one is already in your bag."
        : `You already have all ${available} available in your bag.`,
    );
  }
  if (quantity > MAX_QUANTITY) return fail(`You can add up to ${MAX_QUANTITY} of one item.`);

  if (line) {
    line.quantity = quantity;
  } else {
    if (items.length >= MAX_LINES) return fail(`Your bag can hold ${MAX_LINES} different items.`);
    items.push({ ...variant, quantity });
  }
  await writeCart(items);
  return { ok: true };
}

/** Sets an absolute quantity, so repeating a request changes nothing. */
export async function setCartQuantity(
  productId: unknown,
  size: unknown,
  value: unknown,
): Promise<CartResult> {
  const variant = parseVariant(productId, size);
  const quantity = parseQuantity(value);
  if (!variant || quantity === null) return fail("That quantity isn't valid.");

  const available = await getAvailable(variant);
  if (!available) return fail("This item is no longer available.");
  if (quantity > available) return fail(`Only ${available} left.`);

  const items = await readCart();
  const line = items.find((i) => isSameVariant(i, variant));
  if (!line) return fail("This item is no longer in your bag.");

  line.quantity = quantity;
  await writeCart(items);
  return { ok: true };
}

export async function removeFromCart(productId: unknown, size: unknown): Promise<CartResult> {
  const variant = parseVariant(productId, size);
  if (!variant) return fail("This item isn't in your bag.");

  const items = await readCart();
  await writeCart(items.filter((i) => !isSameVariant(i, variant)));
  return { ok: true };
}
