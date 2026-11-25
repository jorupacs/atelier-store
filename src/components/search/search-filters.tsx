"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";

import { SortSelect } from "@/components/product/sort-select";
import type { Category } from "@/lib/products";
import { searchHref, SORT_OPTIONS, type SearchState } from "@/lib/search";

export type CategoryFacet = Category & { count: number };

type Props = {
  state: SearchState;
  facets: CategoryFacet[];
  total: number;
};

/** Category, availability and sort controls. Choices show at once while results load. */
export function SearchFilters({ state, facets, total }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useOptimistic(state);
  const [isPending, setIsPending] = useOptimistic(false);

  const update = (change: Partial<SearchState>) => {
    const next = { ...current, ...change };
    startTransition(() => {
      setCurrent(next);
      setIsPending(true);
      router.replace(searchHref(next), { scroll: false });
    });
  };

  const options = [{ slug: null, name: "All", count: total }, ...facets];

  return (
    <div
      className="flex flex-col gap-5 lg:flex-row lg:items-center"
      data-pending={isPending ? "" : undefined}
    >
      {/* With a single category there is nothing to choose. */}
      {facets.length > 1 && (
        <div role="group" aria-label="Filter by category" className="cluster gap-2">
          {options.map((o) => {
            const selected = current.category === o.slug;
            return (
              <button
                key={o.slug ?? "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ category: o.slug })}
                className={`h-11 cursor-pointer border px-4 text-body-sm transition-colors duration-[var(--duration-fast)] ${
                  selected ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                }`}
              >
                {o.name} <span className={selected ? undefined : "text-muted"}>({o.count})</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:ml-auto lg:shrink-0">
        <label className="flex h-11 cursor-pointer items-center gap-2 text-body-sm">
          <input
            type="checkbox"
            checked={current.inStock}
            onChange={(e) => update({ inStock: e.target.checked })}
            className="size-4 accent-ink"
          />
          In stock only
        </label>
        <SortSelect
          options={SORT_OPTIONS}
          value={current.sort}
          onChange={(sort) => update({ sort })}
        />
      </div>
    </div>
  );
}
