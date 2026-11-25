import Link from "next/link";

import { BrowseSuggestions } from "@/components/collection/browse-suggestions";
import { getCart } from "@/db/queries/cart";
import { readCart } from "@/lib/cart-cookie";
import { formatPrice } from "@/lib/format";
import { BagLine } from "./bag-line";

export async function BagContents() {
  const cart = await getCart(await readCart());

  if (cart.lines.length === 0) {
    return (
      <div className="hairline-t pt-8 md:pt-10">
        <div className="stack mb-10 items-start gap-4">
          <p className="text-body-lg">Your bag is empty.</p>
          <p className="text-muted">Pieces you add will appear here, ready when you are.</p>
          <Link href="/collections/new" className="btn btn-primary">
            Shop new arrivals
          </Link>
        </div>
        <BrowseSuggestions />
      </div>
    );
  }

  const issues = cart.lines.filter((l) => l.status !== "ok").length;

  return (
    <div className="group/bag grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <ul className="hairline-t">
        {cart.lines.map((line) => (
          <BagLine key={`${line.productId}:${line.size ?? ""}`} line={line} />
        ))}
      </ul>
      <section
        aria-labelledby="summary-heading"
        className="stack gap-4 self-start bg-canvas p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]"
      >
        <h2 id="summary-heading" className="eyebrow font-sans">
          Summary
        </h2>
        <div className="flex justify-between gap-4 transition-opacity duration-[var(--duration-fast)] group-has-data-pending/bag:opacity-50">
          <p>
            Subtotal{" "}
            <span className="text-muted">
              ({cart.count} {cart.count === 1 ? "item" : "items"})
            </span>
          </p>
          <p className="tabular-nums" data-testid="subtotal">
            {formatPrice(cart.subtotal)}
          </p>
        </div>
        {cart.hasIssues && (
          <p className="text-body-sm text-error">
            {issues === 1 ? "1 item needs" : `${issues} items need`} your attention. The subtotal
            includes only what&apos;s in stock.
          </p>
        )}
        <div className="meta stack gap-1.5">
          <p>Complimentary express shipping and returns</p>
          <p>Items aren&apos;t reserved while they&apos;re in your bag.</p>
        </div>
        <Link href="/collections/new" className="btn btn-secondary btn-block">
          Continue shopping
        </Link>
      </section>
    </div>
  );
}

/** Layout-matched placeholder shown while the bag streams in. */
export function BagSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16" aria-busy="true">
      <div className="hairline-t">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="hairline-b flex gap-4 py-6 md:gap-6">
            <div className="aspect-[var(--aspect-product)] w-24 shrink-0 animate-pulse bg-canvas sm:w-32" />
            <div className="stack flex-1 gap-3">
              <div className="h-4 w-1/2 animate-pulse bg-canvas" />
              <div className="h-3 w-1/3 animate-pulse bg-canvas" />
              <div className="mt-auto h-11 w-30 animate-pulse bg-canvas" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-52 animate-pulse self-start bg-canvas" />
      <span className="sr-only">Loading your bag</span>
    </div>
  );
}
