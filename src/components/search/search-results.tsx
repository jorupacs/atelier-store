import Link from "next/link";

import { BrowseSuggestions } from "@/components/collection/browse-suggestions";
import { ProductCard } from "@/components/product/product-card";
import { searchProducts } from "@/db/queries/products";
import type { Product } from "@/lib/products";
import { getSearchTerms, searchHref, type SearchState } from "@/lib/search";
import { SearchFilters, type CategoryFacet } from "./search-filters";

/** Dims results while newer ones load. */
const PENDING_DIM =
  "transition-opacity duration-[var(--duration-base)] group-has-data-pending/search:opacity-50";

export async function SearchResults({ state }: { state: SearchState }) {
  const { query } = state;
  const matches = query ? await searchProducts(getSearchTerms(query), state.sort) : [];

  const available = state.inStock ? matches.filter((p) => p.stock > 0) : matches;
  const facets = countByCategory(available);
  // A category the current matches don't include (an old link) counts as "All".
  const category = facets.some((f) => f.slug === state.category) ? state.category : null;
  const results = category ? available.filter((p) => p.category.slug === category) : available;

  let status = "";
  if (query) {
    status = results.length
      ? `${results.length} ${results.length === 1 ? "piece" : "pieces"} for “${query}”`
      : `No ${matches.length ? "in-stock " : ""}pieces for “${query}”`;
  }

  return (
    <>
      {/* Always rendered so screen readers announce each change. */}
      <p role="status" className="meta mt-4 min-h-[1.4em] break-words">
        {status}
      </p>

      {matches.length > 0 ? (
        <section className="mt-6" aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="sr-only">
            Results
          </h2>
          <SearchFilters
            state={{ ...state, category }}
            facets={facets}
            total={available.length}
          />
          {results.length > 0 ? (
            <ProductGrid products={results} className="hairline-t mt-6 pt-8 md:pt-10" />
          ) : (
            <div className="stack hairline-t mt-6 items-center py-[var(--section-y)] text-center">
              <p className="text-muted">Everything that matches is currently sold out.</p>
              <Link
                href={searchHref({ ...state, category: null, inStock: false })}
                replace
                scroll={false}
                className="btn btn-secondary"
              >
                Show sold-out pieces
              </Link>
            </div>
          )}
        </section>
      ) : (
        <Suggestions query={query} />
      )}
    </>
  );
}

/** Shown when there is nothing to list: no query yet, or no matches. */
function Suggestions({ query }: { query: string }) {
  return (
    <div className="mt-6">
      {query && (
        <p className="mb-8 max-w-prose-narrow text-muted">
          Check the spelling or try a broader word, such as a material, a color or a type of piece.
        </p>
      )}
      <BrowseSuggestions gridClassName={PENDING_DIM} />
    </div>
  );
}

function ProductGrid({ products, className = "" }: { products: Product[]; className?: string }) {
  return (
    <div
      className={`grid-products ${PENDING_DIM} ${className}`}
    >
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

function countByCategory(products: Product[]): CategoryFacet[] {
  const facets = new Map<string, CategoryFacet>();
  for (const { category } of products) {
    const facet = facets.get(category.slug);
    if (facet) facet.count++;
    else facets.set(category.slug, { ...category, count: 1 });
  }
  return [...facets.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Layout-matched placeholder shown while results stream in. */
export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mt-4 h-4 w-32 animate-pulse bg-canvas" />
      <div className="mt-6 h-11 w-full max-w-md animate-pulse bg-canvas" />
      <div className="grid-products hairline-t mt-6 pt-8 md:pt-10">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[var(--aspect-product)] animate-pulse bg-canvas" />
        ))}
      </div>
      <span className="sr-only">Loading results</span>
    </div>
  );
}
