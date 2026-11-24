/**
 * Product types and client-safe helpers.
 *
 * Product data lives in Postgres: query it on the server through
 * `@/db/queries/products`. This module must not import the database, because
 * client components (e.g. PurchasePanel) import it.
 */

export type ProductImage = {
  src: string;
  alt: string;
  /** CSS object-position, used to frame detail crops. */
  focus?: string;
  /** Scale factor for detail crops of the same photo (1 = full frame). */
  zoom?: number;
};

export type Category = {
  slug: string;
  name: string;
};

export type Size = {
  label: string;
  available: boolean;
};

export type Product = {
  id: number;
  slug: string;
  sku: string;
  name: string;
  detail: string; // material / color line shown on cards
  price: number; // cents
  category: Category;
  badge?: "New" | "Exclusive";
  /** Units available across all sizes. 0 = sold out. */
  stock: number;
  /** Omitted for one-size items. */
  sizes?: Size[];
  description: string;
  details: string[];
  care: string[];
  /** First image is the primary image used on product cards. */
  images: ProductImage[];
};

/** Stock at or below this number is shown as "low stock". */
export const LOW_STOCK_THRESHOLD = 3;

export type StockState =
  | { status: "in_stock"; label: string }
  | { status: "low_stock"; label: string }
  | { status: "out_of_stock"; label: string };

export function getStockState(product: Pick<Product, "stock">): StockState {
  if (product.stock <= 0) return { status: "out_of_stock", label: "Sold out" };
  if (product.stock <= LOW_STOCK_THRESHOLD) {
    return { status: "low_stock", label: `Only ${product.stock} left` };
  }
  return { status: "in_stock", label: "In stock" };
}
