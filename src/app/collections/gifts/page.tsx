import type { Metadata } from "next";

import { ProductListing } from "@/components/collection/product-listing";
import { getGiftProducts } from "@/db/queries/products";
import { giftBanner } from "@/lib/catalog";

export const metadata: Metadata = {
  title: `${giftBanner.title} | Atelier`,
  description: giftBanner.description,
};

export default async function GiftsPage() {
  const products = await getGiftProducts();

  return (
    <ProductListing
      eyebrow={giftBanner.eyebrow}
      title={giftBanner.title}
      description={`${giftBanner.description} Every order ships with complimentary gift wrapping and a handwritten note.`}
      products={products}
      emptyMessage="This season's gifts are being wrapped. Check back soon."
    />
  );
}
