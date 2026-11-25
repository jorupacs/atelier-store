"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { Category } from "@/lib/products";

type Props = {
  categories: Category[];
  /** Slug of the category being viewed. */
  current?: string;
  label: string;
};

/** Category links: one swipeable row up to lg, wrapping from there. */
export function CategoryLinks({ categories, current, label }: Props) {
  const list = useRef<HTMLUListElement>(null);

  // Bring the current category into view in the swipeable row. Sets scrollLeft
  // rather than scrollIntoView, which could also scroll the page.
  useEffect(() => {
    const el = list.current;
    const active = el?.querySelector<HTMLElement>("[aria-current]");
    if (!el || !active) return;
    const offset = active.getBoundingClientRect().left - el.getBoundingClientRect().left;
    el.scrollLeft += offset - (el.clientWidth - active.offsetWidth) / 2;
  }, [current]);

  return (
    <nav aria-label={label} className="-mx-[var(--gutter)] min-w-0 lg:mx-0">
      <ul
        ref={list}
        className="flex gap-2 overflow-x-auto px-[var(--gutter)] py-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c) => {
          const active = c.slug === current;
          return (
            <li key={c.slug} className="shrink-0">
              <Link
                href={`/collections/${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center border px-4 text-body-sm transition-colors duration-[var(--duration-fast)] ${
                  active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                }`}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
