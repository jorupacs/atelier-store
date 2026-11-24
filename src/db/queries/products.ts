/**
 * Server-side product queries. This is the only place the storefront reads
 * product, category and stock data from the database.
 *
 * Results are cached with `"use cache"` (required under `cacheComponents`).
 * The `minutes` profile still prerenders, and stock edits show up within
 * about a minute. Call `revalidateTag("products")` after writes to refresh
 * them right away.
 */

import { cacheLife, cacheTag } from "next/cache";
import { eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Product } from "@/lib/products";

const withRelations = {
  category: { columns: { slug: true, name: true } },
  stock: {
    columns: { size: true, quantity: true },
    orderBy: (stock, { asc }) => [asc(stock.position), asc(stock.id)],
  },
} as const satisfies NonNullable<Parameters<typeof db.query.products.findMany>[0]>["with"];

type ProductRow = NonNullable<
  Awaited<ReturnType<typeof db.query.products.findFirst<{ with: typeof withRelations }>>>
>;

/** Maps a row to the storefront's `Product` shape, deriving stock and sizes. */
function toProduct(row: ProductRow): Product {
  const sized = row.stock.filter((s) => s.size !== null);
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    detail: row.detail,
    price: row.price,
    category: row.category,
    badge: row.badge ?? undefined,
    stock: row.stock.reduce((sum, s) => sum + s.quantity, 0),
    sizes: sized.length
      ? sized.map((s) => ({ label: s.size!, available: s.quantity > 0 }))
      : undefined,
    description: row.description,
    details: row.details,
    care: row.care,
    images: row.images,
  };
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((r) => r.slug);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);

  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: withRelations,
  });
  return row ? toProduct(row) : null;
}

/** Newest products first. */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.query.products.findMany({
    with: withRelations,
    orderBy: (p, { desc }) => [desc(p.createdAt), desc(p.id)],
    limit,
  });
  return rows.map(toProduct);
}

/** Same-category products first, then others, excluding the given product. */
export async function getRelatedProducts(
  productId: number,
  categorySlug: string,
  limit = 4,
): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const categoryId = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, categorySlug));

  const rows = await db.query.products.findMany({
    where: ne(products.id, productId),
    with: withRelations,
    orderBy: (p, { desc }) => [
      desc(sql`${p.categoryId} = (${categoryId})`),
      desc(p.createdAt),
      desc(p.id),
    ],
    limit,
  });
  return rows.map(toProduct);
}
