/**
 * Cart reads. Unlike the product queries these are never cached: the cart must
 * use the current price and stock.
 */

import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/db";
import { products, productStock } from "@/db/schema";
import { buildCart, type Cart, type CartItem, type Variant } from "@/lib/cart";

export async function getCart(items: CartItem[]): Promise<Cart> {
  if (items.length === 0) return buildCart([], []);

  // Request time only, so prerendering never starts (and aborts) this query.
  await connection();
  const rows = await db.query.products.findMany({
    columns: { id: true, slug: true, name: true, detail: true, price: true, images: true },
    where: inArray(products.id, [...new Set(items.map((i) => i.productId))]),
    with: { stock: { columns: { size: true, quantity: true } } },
  });
  return buildCart(
    items,
    rows.map(({ images, ...row }) => ({ ...row, image: images[0] })),
  );
}

/** Units in stock for one product and size. Null if that combination doesn't exist. */
export async function getAvailable({ productId, size }: Variant): Promise<number | null> {
  const [row] = await db
    .select({ quantity: productStock.quantity })
    .from(productStock)
    .where(
      and(
        eq(productStock.productId, productId),
        size === null ? isNull(productStock.size) : eq(productStock.size, size),
      ),
    )
    .limit(1);
  return row?.quantity ?? null;
}
