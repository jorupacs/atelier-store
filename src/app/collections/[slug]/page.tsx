import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryLinks } from "@/components/collection/category-links";
import { ProductListing, ProductListingSkeleton } from "@/components/collection/product-listing";
import { getCategories, getCategorySlugs, getCategoryWithProducts } from "@/db/queries/products";
import { collections } from "@/lib/catalog";

// `/collections/new` and `/collections/gifts` are static routes and take precedence over this one.

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

/** Editorial copy from the homepage collections when one matches, else a default. */
function describe(slug: string, name: string) {
  return (
    collections.find((c) => c.slug === slug)?.description ??
    `Discover our ${name.toLowerCase()}, made in small runs.`
  );
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const result = await getCategoryWithProducts(slug);
  if (!result) return {};
  const { category } = result;
  return {
    title: `${category.name} | Atelier`,
    description: describe(category.slug, category.name),
  };
}

type Params = PageProps<"/collections/[slug]">["params"];

/** Same shape as the product page: a static shell with the content behind Suspense. */
export default function CategoryPage(props: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <CategoryListing params={props.params} />
    </Suspense>
  );
}

async function CategoryListing({ params }: { params: Params }) {
  const { slug } = await params;
  const [result, categories] = await Promise.all([getCategoryWithProducts(slug), getCategories()]);
  if (!result) notFound();

  const { category, products } = result;
  return (
    <ProductListing
      eyebrow="Collection"
      title={category.name}
      description={describe(category.slug, category.name)}
      products={products}
      nav={<CategoryLinks categories={categories} current={category.slug} label="Categories" />}
      sortable
    />
  );
}
