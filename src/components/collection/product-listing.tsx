import Link from "next/link";
import type { ReactNode } from "react";

import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/products";
import { SortableProducts } from "./sortable-products";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  emptyMessage?: string;
  /** Links to sibling listings, shown above the grid. */
  nav?: ReactNode;
  /** Adds a sort control. Products must be newest first. */
  sortable?: boolean;
};

/** Shared layout for product listing pages: breadcrumb, header, product grid. */
export function ProductListing({
  eyebrow,
  title,
  description,
  products,
  emptyMessage = "New pieces are on their way. Check back soon.",
  nav,
  sortable = false,
}: Props) {
  const empty = products.length === 0;

  return (
    <div className="container-page pt-4 pb-[var(--section-y)] md:pt-6">
      <nav aria-label="Breadcrumb" className="mb-4 hidden md:block lg:mb-6">
        <ol className="meta flex items-center gap-2">
          <li>
            <Link href="/" className="link-muted">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">
            {title}
          </li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-col gap-4 pt-4 md:mb-10 md:flex-row md:items-end md:justify-between md:pt-6">
        <div className="stack max-w-xl gap-3">
          <p className="eyebrow text-muted">{eyebrow}</p>
          <h1 className="text-display">{title}</h1>
          <p className="text-muted">{description}</p>
        </div>
        {!empty && (
          <p className="meta">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        )}
      </header>

      {!empty && sortable ? (
        <SortableProducts
          nav={nav}
          items={products.map((p) => ({
            slug: p.slug,
            price: p.price,
            card: <ProductCard product={p} />,
          }))}
        />
      ) : (
        <>
          {nav && <div className="mb-6">{nav}</div>}
          {empty ? (
            <div className="stack hairline-t items-center gap-4 py-[var(--section-y)] text-center">
              <p className="text-muted">{emptyMessage}</p>
              <Link href="/" className="btn btn-secondary">
                Back to home
              </Link>
            </div>
          ) : (
            <div className="grid-products hairline-t pt-8 md:pt-10">
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Layout-matched placeholder shown while a listing streams in. */
export function ProductListingSkeleton() {
  return (
    <div className="container-page pt-4 pb-[var(--section-y)] md:pt-6" aria-busy="true">
      <div className="mb-4 hidden h-4 md:block lg:mb-6" />
      <div className="stack mb-8 max-w-xl gap-3 pt-4 md:mb-10 md:pt-6">
        <div className="h-3 w-24 animate-pulse bg-canvas" />
        <div className="h-12 w-2/3 animate-pulse bg-canvas" />
        <div className="h-4 w-1/2 animate-pulse bg-canvas" />
      </div>
      <div className="mb-6 h-13 animate-pulse bg-canvas" />
      <div className="grid-products hairline-t pt-8 md:pt-10">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[var(--aspect-product)] animate-pulse bg-canvas" />
        ))}
      </div>
      <span className="sr-only">Loading products</span>
    </div>
  );
}
