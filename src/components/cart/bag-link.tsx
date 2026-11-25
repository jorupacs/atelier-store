"use client";

import Link from "next/link";

import { BagIcon } from "@/components/icons";
import { useCartCount } from "./use-cart-count";

/** Header link to the bag, with the number of units in it. */
export function BagLink() {
  const count = useCartCount();

  return (
    <Link
      href="/bag"
      className="btn btn-icon relative"
      aria-label={count ? `Shopping bag, ${count} ${count === 1 ? "item" : "items"}` : "Shopping bag"}
    >
      <BagIcon />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-pill bg-ink px-1 text-[0.625rem] leading-none tracking-normal text-paper"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
