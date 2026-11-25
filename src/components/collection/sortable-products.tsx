"use client";

import { Fragment, useState, type ReactNode } from "react";

import { SortSelect } from "@/components/product/sort-select";
import { SORT_OPTIONS, type SearchSort } from "@/lib/search";

type Sort = Exclude<SearchSort, "relevance">;

const OPTIONS = SORT_OPTIONS.filter(
  (o): o is Extract<(typeof SORT_OPTIONS)[number], { value: Sort }> => o.value !== "relevance",
);

/** A server-rendered card, with the one field needed to order it. */
export type SortableItem = { slug: string; price: number; card: ReactNode };

type Props = {
  /** Newest first. */
  items: SortableItem[];
  /** Shown beside the sort control. */
  nav?: ReactNode;
};

/**
 * Product grid with a sort control. The whole category is on the page, so
 * sorting happens in the browser and the page itself stays static.
 */
export function SortableProducts({ items, nav }: Props) {
  const [sort, setSort] = useState<Sort>("newest");

  const sorted =
    sort === "newest"
      ? items
      : [...items].sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));

  return (
    <section aria-labelledby="products-heading">
      <h2 id="products-heading" className="sr-only">
        Products
      </h2>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {nav}
        {/* With a single product there is nothing to sort. */}
        {items.length > 1 && (
          <div className="self-end lg:shrink-0 lg:self-auto">
            <SortSelect options={OPTIONS} value={sort} onChange={setSort} />
          </div>
        )}
      </div>
      <div className="grid-products hairline-t pt-8 md:pt-10">
        {sorted.map((item) => (
          <Fragment key={item.slug}>{item.card}</Fragment>
        ))}
      </div>
    </section>
  );
}
