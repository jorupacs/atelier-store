/**
 * Search URL state and query parsing. Client-safe: must not import the database.
 *
 * The URL is the source of truth: /search?q=wool&category=outerwear&stock=in&sort=newest
 */

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
] as const;

export type SearchSort = (typeof SORT_OPTIONS)[number]["value"];

export type SearchState = {
  query: string;
  category: string | null;
  inStock: boolean;
  sort: SearchSort;
};

export const MAX_QUERY_LENGTH = 80;
const MAX_TERMS = 6;

export function normalizeQuery(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).trim();
}

export function parseSort(value: string | null | undefined): SearchSort {
  return SORT_OPTIONS.find((o) => o.value === value)?.value ?? "relevance";
}

type RawParams = Record<string, string | string[] | undefined>;

export function parseSearchState(params: RawParams): SearchState {
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    query: normalizeQuery(first("q") ?? ""),
    category: first("category") || null,
    inStock: first("stock") === "in",
    sort: parseSort(first("sort")),
  };
}

/** Builds a search URL, leaving out defaults so equal searches share one URL. */
export function searchHref({ query, category, inStock, sort }: SearchState): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (inStock) params.set("stock", "in");
  if (sort !== "relevance") params.set("sort", sort);
  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

const STOP_WORDS = new Set(["a", "an", "and", "for", "in", "of", "or", "the", "to", "with"]);

/**
 * Splits a query into lowercase alphanumeric terms. Filler words and stray
 * letters ("women's" → "women", "s") are dropped unless they're all there is.
 */
export function getSearchTerms(query: string): string[] {
  const terms = [...new Set(query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean))];
  const meaningful = terms.filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  return (meaningful.length ? meaningful : terms).slice(0, MAX_TERMS);
}
