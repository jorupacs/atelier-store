import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BagAnnouncer } from "@/components/cart/bag-announcer";
import { BagContents, BagSkeleton } from "@/components/cart/bag-contents";
import { BAG_HEADING_ID } from "@/components/cart/bag-heading";

export const metadata: Metadata = {
  title: "Shopping bag | Atelier",
  robots: { index: false },
};

/** Static shell with the cart behind Suspense. */
export default function BagPage() {
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
            Shopping bag
          </li>
        </ol>
      </nav>
      <BagAnnouncer>
        <h1
          id={BAG_HEADING_ID}
          tabIndex={-1}
          className="mb-8 pt-4 text-display outline-none md:mb-10 md:pt-6"
        >
          Shopping bag
        </h1>
        <Suspense fallback={<BagSkeleton />}>
          <BagContents />
        </Suspense>
      </BagAnnouncer>
    </div>
  );
}
