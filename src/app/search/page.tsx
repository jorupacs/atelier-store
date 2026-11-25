import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SearchField, SearchFieldFallback } from "@/components/search/search-field";
import { SearchResults, SearchResultsSkeleton } from "@/components/search/search-results";
import { parseSearchState } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search | Atelier",
  description: "Search the collection by piece, material or category.",
  // Result pages are endless URL variations of the catalog.
  robots: { index: false, follow: true },
};

/** Same header as the listing pages. Static shell with the URL-dependent field and results behind Suspense. */
export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="group/search container-page pt-4 pb-[var(--section-y)] md:pt-6">
      <nav aria-label="Breadcrumb" className="mb-4 hidden md:block lg:mb-6">
        <ol className="meta flex items-center gap-2">
          <li>
            <Link href="/" className="link-muted">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">
            Search
          </li>
        </ol>
      </nav>

      <header className="stack gap-6 pt-4 md:pt-6">
        <div className="stack max-w-xl gap-3">
          <p className="eyebrow text-muted">Discover</p>
          <h1 className="text-display">Search</h1>
          <p className="text-muted">Find a piece by name, material or category.</p>
        </div>
        <Suspense fallback={<SearchFieldFallback />}>
          <SearchField />
        </Suspense>
      </header>
      <Suspense fallback={<SearchResultsSkeleton />}>
        {props.searchParams.then((params) => (
          <SearchResults state={parseSearchState(params)} />
        ))}
      </Suspense>
    </div>
  );
}
