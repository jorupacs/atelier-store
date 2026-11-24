import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { getStockState, type Product } from "@/lib/products";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = getStockState(product).status === "out_of_stock";
  const badge = soldOut ? "Sold out" : product.badge;

  return (
    <article className="group relative">
      <div className="media-product">
        <ProductImage
          image={product.images[0]}
          sizes="(min-width: 80rem) 25vw, (min-width: 64rem) 33vw, 50vw"
        />
        {badge && (
          <span
            className={`meta absolute top-3 left-3 px-2 py-1 uppercase ${
              soldOut ? "bg-ink text-paper" : "bg-paper text-ink"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1 px-0.5 md:mt-4">
        <h3 className="font-sans text-body-sm font-medium">
          {/* Stretched link: the whole card is clickable. */}
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="meta">{product.detail}</p>
        <p className={`text-body-sm ${soldOut ? "text-muted" : ""}`}>
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
