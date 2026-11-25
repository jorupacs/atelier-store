import Link from "next/link";

import { CategoryLinks } from "@/components/collection/category-links";
import { getCategories } from "@/db/queries/products";

export default async function CollectionNotFound() {
  const categories = await getCategories();

  return (
    <section className="container-content section-y text-center">
      <div className="mx-auto stack max-w-prose-narrow items-center gap-4">
        <p className="eyebrow text-muted">Not found</p>
        <h1 className="text-display">This collection is not available</h1>
        <p className="text-muted">Explore the categories we carry, or see what has just arrived.</p>
        <div className="mt-4 max-w-full">
          <CategoryLinks categories={categories} label="Categories" />
        </div>
        <Link href="/collections/new" className="btn btn-primary mt-4">
          Shop new arrivals
        </Link>
      </div>
    </section>
  );
}
