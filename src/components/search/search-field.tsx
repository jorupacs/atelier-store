"use client";

import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { CloseIcon, SearchIcon } from "@/components/icons";
import { MAX_QUERY_LENGTH, normalizeQuery, parseSort, searchHref } from "@/lib/search";

const DEBOUNCE_MS = 250;

/** Same bordered input as the newsletter form, with room for the icons. */
const FIELD = "flex h-12 items-center gap-3 border border-line-strong bg-paper px-4";

/** Search input that updates the URL while typing. Submitting before hydration falls back to a GET. */
export function SearchField() {
  const router = useRouter();
  const urlQuery = normalizeQuery(useSearchParams().get("q") ?? "");
  const [value, setValue] = useState(urlQuery);
  /** The last query this field put in (or took from) the URL. */
  const [sent, setSent] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The URL changed from elsewhere (back button, a link): follow it.
  if (!isPending && urlQuery !== sent) {
    setSent(urlQuery);
    setValue(urlQuery);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (text: string) => {
    clearTimeout(timer.current);
    const query = normalizeQuery(text);
    if (query === sent) return;
    // A new query keeps sort and stock, but its categories may differ.
    const params = new URLSearchParams(window.location.search);
    const href = searchHref({
      query,
      category: null,
      inStock: params.get("stock") === "in",
      sort: parseSort(params.get("sort")),
    });
    setSent(query);
    startTransition(() => router.replace(href, { scroll: false }));
  };

  return (
    <Form
      action="/search"
      role="search"
      data-pending={isPending ? "" : undefined}
      className={`${FIELD} focus-within:outline-1 focus-within:outline-offset-2 focus-within:outline-ink`}
      onSubmit={(e) => {
        e.preventDefault();
        search(value);
      }}
    >
      <SearchIcon className="shrink-0 text-muted" />
      <label htmlFor="search-query" className="sr-only">
        Search products
      </label>
      <input
        ref={input}
        id="search-query"
        type="search"
        name="q"
        value={value}
        maxLength={MAX_QUERY_LENGTH}
        // Arriving without a query means the visitor came here to type one.
        autoFocus={!urlQuery}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        placeholder="Coats, silk, gold…"
        onChange={(e) => {
          const text = e.target.value;
          setValue(text);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => search(text), DEBOUNCE_MS);
        }}
        onBlur={() => search(value)}
        className="h-full min-w-0 flex-1 bg-transparent text-body-lg outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="btn btn-icon -mr-2.5 shrink-0"
          onClick={() => {
            setValue("");
            search("");
            input.current?.focus();
          }}
        >
          <CloseIcon />
        </button>
      )}
    </Form>
  );
}

/** Same footprint as the field, shown in the static shell. */
export function SearchFieldFallback() {
  return (
    <div className={FIELD} aria-hidden>
      <SearchIcon className="shrink-0 text-muted" />
    </div>
  );
}
