import type { Metadata } from "next";

import { ProductListing } from "@/components/collection/product-listing";
import { getNewArrivals } from "@/db/queries/products";

export const metadata: Metadata = {
  title: "New arrivals | Atelier",
  description: "The latest pieces from the atelier, newest first.",
};

/** How many of the newest products the page lists. */
const LIMIT = 24;

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(LIMIT);

  return (
    <ProductListing
      eyebrow="Just in"
      title="New arrivals"
      description="The latest pieces from our workshops, newest first."
      products={products}
    />
  );
}
