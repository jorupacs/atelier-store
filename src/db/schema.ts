// Drizzle schema entry point.
//
// Better Auth tables (user, session, account, verification) can be generated with:
//   npm run auth:generate

import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import type { ProductImage } from "@/lib/products";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ...timestamps,
});

export const productBadge = pgEnum("product_badge", ["New", "Exclusive"]);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    /** Material / color line shown on cards. */
    detail: text("detail").notNull(),
    /** Price in cents. */
    price: integer("price").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    badge: productBadge("badge"),
    description: text("description").notNull(),
    details: text("details").array().notNull().default(sql`'{}'::text[]`),
    care: text("care").array().notNull().default(sql`'{}'::text[]`),
    /** First image is the primary image used on product cards. */
    images: jsonb("images").$type<ProductImage[]>().notNull(),
    ...timestamps,
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    index("products_created_at_idx").on(t.createdAt),
    check("products_price_nonnegative", sql`${t.price} >= 0`),
  ],
);

/** Units on hand per product and size. `size` is null for one-size items. */
export const productStock = pgTable(
  "product_stock",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size"),
    /** Display order of sizes (XS → XL, 36 → 41). */
    position: integer("position").notNull().default(0),
    quantity: integer("quantity").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    unique("product_stock_product_size_unique").on(t.productId, t.size).nullsNotDistinct(),
    check("product_stock_quantity_nonnegative", sql`${t.quantity} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stock: many(productStock),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
}));
