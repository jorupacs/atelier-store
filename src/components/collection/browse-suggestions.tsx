import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getNewArrivals } from "@/db/queries/products";
import { CategoryLinks } from "./category-links";

const ARRIVALS = 4;

/** Ways onward when a page has nothing to list: categories and new arrivals. */
export async function BrowseSuggestions({ gridClassName = "" }: { gridClassName?: string }) {
  const [categories, arrivals] = await Promise.all([getCategories(), getNewArrivals(ARRIVALS)]);

  return (
    <>
      {categories.length > 0 && (
        <div className="stack">
          <h2 className="eyebrow font-sans text-muted">Browse by category</h2>
          <CategoryLinks categories={categories} label="Browse by category" />
        </div>
      )}
      {arrivals.length > 0 && (
        <section className="hairline-t mt-10 pt-10">
          <SectionHeading
            eyebrow="Just in"
            title="New arrivals"
            action={{ label: "View all", href: "/collections/new" }}
          />
          <div className={`grid-products ${gridClassName}`}>
            {arrivals.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
