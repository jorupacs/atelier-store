import Link from "next/link";

import { ProductImage } from "@/components/product/product-image";
import type { CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { LineControls } from "./line-controls";

/** One product and size in the bag. Fades while it's being removed. */
export function BagLine({ line }: { line: CartLine }) {
  const { product, size, status } = line;
  const name = product?.name ?? "This item";
  const buyable = status === "ok" || status === "reduced";
  const badge =
    status === "sold_out" ? "Sold out" : status === "unavailable" ? "Unavailable" : null;

  return (
    <li className="hairline-b flex gap-4 py-6 transition-opacity duration-[var(--duration-base)] has-data-removing:opacity-40 md:gap-6">
      <div className="media-product w-24 shrink-0 self-start sm:w-32">
        {product?.image && (
          <div className={buyable ? undefined : "opacity-50"}>
            <ProductImage image={product.image} sizes="(min-width: 40rem) 8rem, 6rem" />
          </div>
        )}
        {badge && (
          <span className="meta absolute inset-x-0 bottom-0 bg-ink px-2 py-1 text-center text-paper uppercase">
            {badge}
          </span>
        )}
      </div>

      <div className="stack min-w-0 flex-1 gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
          <div className="stack min-w-0 gap-1">
            <h2 className="font-sans text-body-sm font-medium break-words">
              {product ? (
                <Link href={`/products/${product.slug}`} className="link-quiet">
                  {name}
                </Link>
              ) : (
                name
              )}
            </h2>
            {product && <p className="meta">{product.detail}</p>}
            {size && <p className="meta">Size {size}</p>}
          </div>
          {product && buyable && (
            <div className="flex flex-wrap items-baseline gap-x-2 sm:flex-col sm:items-end">
              <p className="text-body-sm tabular-nums transition-opacity group-has-data-pending/bag:opacity-50">
                {formatPrice(line.total)}
              </p>
              {line.quantity > 1 && <p className="meta">{formatPrice(product.price)} each</p>}
            </div>
          )}
        </div>

        {!buyable && (
          <p className="text-body-sm text-error">
            {status === "sold_out"
              ? size
                ? `Size ${size} has sold out.`
                : "This piece has sold out."
              : product && size
                ? `Size ${size} is no longer available.`
                : "This piece is no longer available."}{" "}
            It isn&apos;t included in your subtotal.
            {product && line.hasOtherSizes && (
              <>
                {" "}
                <Link href={`/products/${product.slug}`} className="link">
                  {size ? "Choose another size" : "Choose a size"}
                </Link>
              </>
            )}
          </p>
        )}

        <LineControls
          productId={line.productId}
          size={size}
          quantity={line.quantity}
          available={line.available}
          status={status}
          name={name}
        />
      </div>
    </li>
  );
}
