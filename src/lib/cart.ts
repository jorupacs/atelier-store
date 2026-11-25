/**
 * Cart types and pure helpers. Client-safe: must not import the database.
 *
 * The cart cookie holds only what the customer chose: product, size, quantity.
 * Prices, names and stock always come from the database, so nothing in the
 * cookie (which the customer can edit) affects what anything costs.
 */

import type { ProductImage } from "@/lib/products";

export const CART_COOKIE = "cart";
export const MAX_LINES = 20;
export const MAX_QUANTITY = 99;

const MAX_SIZE_LENGTH = 20;
/** Largest Postgres `integer`. Anything above would make the query fail. */
const MAX_ID = 2_147_483_647;

export type CartItem = {
  productId: number;
  /** Null for one-size products. */
  size: string | null;
  quantity: number;
};

export type Variant = Pick<CartItem, "productId" | "size">;

export function parseVariant(productId: unknown, size: unknown): Variant | null {
  if (typeof productId !== "number" || !Number.isInteger(productId)) return null;
  if (productId < 1 || productId > MAX_ID) return null;
  if (size === null) return { productId, size };
  if (typeof size !== "string" || size.length < 1 || size.length > MAX_SIZE_LENGTH) return null;
  return { productId, size };
}

export function parseQuantity(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY
    ? value
    : null;
}

export const isSameVariant = (a: Variant, b: Variant) =>
  a.productId === b.productId && a.size === b.size;

/** Reads a cookie value, dropping anything invalid and merging repeated lines. */
export function parseCart(value: string | undefined): CartItem[] {
  if (!value) return [];
  let entries: unknown;
  try {
    entries = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(entries)) return [];

  const items: CartItem[] = [];
  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length !== 3) continue;
    const variant = parseVariant(entry[0], entry[1]);
    const raw: unknown = entry[2];
    if (!variant || typeof raw !== "number" || !Number.isInteger(raw) || raw < 1) continue;

    const existing = items.find((i) => isSameVariant(i, variant));
    if (existing) {
      existing.quantity = Math.min(existing.quantity + raw, MAX_QUANTITY);
    } else if (items.length < MAX_LINES) {
      items.push({ ...variant, quantity: Math.min(raw, MAX_QUANTITY) });
    }
  }
  return items;
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items.map((i) => [i.productId, i.size, i.quantity]));
}

export function countItems(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Current product data for one cart line, straight from the database. */
export type CartProduct = {
  id: number;
  slug: string;
  name: string;
  detail: string;
  /** Cents. */
  price: number;
  image: ProductImage | undefined;
  stock: { size: string | null; quantity: number }[];
};

export type CartLine = CartItem & {
  /** Null if the product no longer exists. */
  product: Omit<CartProduct, "stock"> | null;
  /** Units in stock for this size. */
  available: number;
  /** True if a different size of this product is in stock. */
  hasOtherSizes: boolean;
  /** - reduced: some stock, but less than the quantity in the bag */
  status: "ok" | "reduced" | "sold_out" | "unavailable";
  /** Cents, for the units that are in stock. */
  total: number;
};

export type Cart = {
  lines: CartLine[];
  /** Units in stock across all lines. */
  count: number;
  /** Cents, for the units that are in stock. */
  subtotal: number;
  /** True if any line can't be bought as it is. Checkout must refuse these. */
  hasIssues: boolean;
};

export function buildCart(items: CartItem[], products: CartProduct[]): Cart {
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((item): CartLine => {
    const found = byId.get(item.productId);
    const row = found?.stock.find((s) => s.size === item.size);
    const hasOtherSizes = !!found?.stock.some(
      (s) => s.size !== null && s.size !== item.size && s.quantity > 0,
    );
    if (!found || !row) {
      return {
        ...item,
        product: found ? withoutStock(found) : null,
        available: 0,
        hasOtherSizes,
        status: "unavailable",
        total: 0,
      };
    }
    const units = Math.min(item.quantity, row.quantity);
    return {
      ...item,
      product: withoutStock(found),
      available: row.quantity,
      hasOtherSizes,
      status: row.quantity === 0 ? "sold_out" : units < item.quantity ? "reduced" : "ok",
      total: found.price * units,
    };
  });

  return {
    lines,
    count: lines.reduce((sum, l) => sum + Math.min(l.quantity, l.available), 0),
    subtotal: lines.reduce((sum, l) => sum + l.total, 0),
    hasIssues: lines.some((l) => l.status !== "ok"),
  };
}

function withoutStock({ id, slug, name, detail, price, image }: CartProduct) {
  return { id, slug, name, detail, price, image };
}
