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
import { and, eq, inArray, ne, sql, type SQLWrapper } from "drizzle-orm";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category, Product } from "@/lib/products";
import type { SearchSort } from "@/lib/search";

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

export async function getCategorySlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.select({ slug: categories.slug }).from(categories);
  return rows.map((r) => r.slug);
}

/** A category and its products, newest first. Null if the slug is unknown. */
export async function getCategoryWithProducts(
  slug: string,
): Promise<{ category: Category; products: Product[] } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `category:${slug}`);

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    columns: { id: true, slug: true, name: true },
  });
  if (!category) return null;

  const rows = await db.query.products.findMany({
    where: eq(products.categoryId, category.id),
    with: withRelations,
    orderBy: (p, { desc }) => [desc(p.createdAt), desc(p.id)],
  });
  return { category: { slug: category.slug, name: category.name }, products: rows.map(toProduct) };
}

/** Categories curated into the Gift Edit. */
export const GIFT_CATEGORY_SLUGS = ["jewelry", "watches", "eyewear"];

/** The Gift Edit: in-stock pieces from gift categories, newest first. */
export async function getGiftProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const giftCategoryIds = db
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.slug, GIFT_CATEGORY_SLUGS));

  const rows = await db.query.products.findMany({
    where: inArray(products.categoryId, giftCategoryIds),
    with: withRelations,
    orderBy: (p, { desc }) => [desc(p.createdAt), desc(p.id)],
  });
  // Sold-out pieces make poor gift suggestions.
  return rows.map(toProduct).filter((p) => p.stock > 0);
}

/** Categories that have at least one product, by name. */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  return db
    .selectDistinct({ slug: categories.slug, name: categories.name })
    .from(categories)
    .innerJoin(products, eq(products.categoryId, categories.id))
    .orderBy(categories.name);
}

/** A term matches at the start of a word or by English stem. */
function matches(field: SQLWrapper, term: string) {
  return sql`(${field} ~* ${`\\m${term}`} or to_tsvector('english', ${field}) @@ plainto_tsquery('english', ${term}))`;
}

/**
 * Products matching every term. Word-start matching narrows results while
 * typing; stemming lets "coats" find "coat". Pass terms from `getSearchTerms`:
 * they are alphanumeric only, so they are safe inside a regular expression.
 */
export async function searchProducts(terms: string[], sort: SearchSort): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  if (terms.length === 0) return [];

  const rows = await db.query.products.findMany({
    with: withRelations,
    where: (p) => {
      const text = sql`concat_ws(' ', ${p.name}, ${p.detail}, ${categoryNameOf(p.categoryId)}, ${p.description}, array_to_string(${p.details}, ' '), ${p.sku})`;
      return and(...terms.map((t) => matches(text, t)));
    },
    orderBy: (p, { asc, desc }) => {
      const newest = [desc(p.createdAt), desc(p.id)];
      if (sort === "newest") return newest;
      if (sort === "price-asc") return [asc(p.price), ...newest];
      if (sort === "price-desc") return [desc(p.price), ...newest];

      // Relevance: a hit in the name outranks category, then material, then copy.
      const score = sql.join(
        terms.map(
          (t) =>
            sql`case when ${matches(p.name, t)} then 4 when ${matches(categoryNameOf(p.categoryId), t)} then 3 when ${matches(p.detail, t)} then 2 else 0 end`,
        ),
        sql` + `,
      );
      return [desc(sql`(${score})`), ...newest];
    },
  });
  return rows.map(toProduct);
}

/** Plain-text table names: relational queries re-alias interpolated columns. */
function categoryNameOf(categoryId: SQLWrapper) {
  return sql`(select c.name from categories c where c.id = ${categoryId})`;
}
