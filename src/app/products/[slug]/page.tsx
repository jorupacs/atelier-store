import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SectionHeading } from "@/components/home/section-heading";
import { ProductAccordion } from "@/components/product/product-accordion";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { StockIndicator } from "@/components/product/stock-indicator";
import { formatPrice } from "@/lib/format";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/db/queries/products";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | Atelier`,
    description: product.description,
    openGraph: { images: [product.images[0].src] },
  };
}

type Params = PageProps<"/products/[slug]">["params"];

/**
 * The page itself stays synchronous so the route has a static shell; the
 * slug-dependent content streams in behind Suspense. Known slugs are fully
 * prerendered via generateStaticParams, so the fallback rarely shows.
 */
export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductDetail params={props.params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { category } = product;
  const related = await getRelatedProducts(product.id, category.slug);

  return (
    <>
      <div className="container-page pt-4 pb-[var(--section-y)] md:pt-6">
        <nav aria-label="Breadcrumb" className="mb-4 hidden md:block lg:mb-6">
          <ol className="meta flex items-center gap-2">
            <li>
              <Link href="/" className="link-muted">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/collections/${category.slug}`} className="link-muted">
                {category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12 xl:gap-20">
          <ProductGallery images={product.images} />

          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <div className="stack max-w-md gap-6 lg:mx-auto">
              <div className="stack gap-3">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/collections/${category.slug}`}
                    className="eyebrow link-quiet text-muted"
                  >
                    {category.name}
                  </Link>
                  {product.badge && (
                    <span className="meta border border-line px-2 py-0.5 text-ink uppercase">
                      {product.badge}
                    </span>
                  )}
                </div>
                <h1 className="text-heading">{product.name}</h1>
                <p className="text-muted">{product.detail}</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-body-lg">{formatPrice(product.price)}</p>
                <StockIndicator product={product} />
              </div>

              <PurchasePanel
                id={product.id}
                name={product.name}
                stock={product.stock}
                sizes={product.sizes}
              />

              <ul className="meta stack gap-1.5">
                <li>Complimentary express shipping and returns</li>
                <li>Signature gift wrapping available</li>
              </ul>

              <ProductAccordion
                sections={[
                  {
                    title: "Description",
                    defaultOpen: true,
                    content: <p>{product.description}</p>,
                  },
                  {
                    title: "Details",
                    content: (
                      <ul className="stack gap-1">
                        {product.details.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    ),
                  },
                  {
                    title: "Care",
                    content: (
                      <ul className="stack gap-1">
                        {product.care.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    ),
                  },
                  {
                    title: "Shipping & returns",
                    content: (
                      <p>
                        Complimentary express delivery in 2–4 business days. Returns are
                        free within 30 days of delivery.
                      </p>
                    ),
                  },
                ]}
              />

              <p className="meta">Style {product.sku}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="container-page section-y hairline-t">
        <SectionHeading eyebrow="Discover" title="You may also like" />
        <div className="grid-products">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}

/** Layout-matched placeholder shown while product content streams in. */
function ProductPageSkeleton() {
  return (
    <div className="container-page pt-4 pb-[var(--section-y)] md:pt-6" aria-busy="true">
      <div className="mb-4 hidden h-4 md:block lg:mb-6" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12 xl:gap-20">
        <div className="-mx-[var(--gutter)] aspect-[var(--aspect-product)] animate-pulse bg-canvas lg:mx-0" />
        <div className="stack w-full max-w-md gap-4 lg:mx-auto">
          <div className="h-3 w-24 animate-pulse bg-canvas" />
          <div className="h-8 w-3/4 animate-pulse bg-canvas" />
          <div className="h-4 w-1/3 animate-pulse bg-canvas" />
          <div className="mt-4 h-5 w-20 animate-pulse bg-canvas" />
          <div className="mt-4 h-14 w-full animate-pulse bg-canvas" />
        </div>
      </div>
      <span className="sr-only">Loading product</span>
    </div>
  );
}
