import { ProductCard } from "@/components/product/product-card";
import { getNewArrivals } from "@/db/queries/products";
import { SectionHeading } from "./section-heading";

export async function NewArrivals() {
  const newArrivals = await getNewArrivals(8);

  return (
    <section className="container-page section-y hairline-t">
      <SectionHeading
        eyebrow="Just in"
        title="New arrivals"
        action={{ label: "View all", href: "/collections/new" }}
      />
      <div className="grid-products">
        {newArrivals.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
