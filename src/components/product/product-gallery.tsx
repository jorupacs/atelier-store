"use client";

import { useRef, useState } from "react";

import type { ProductImage as ProductImageData } from "@/lib/products";
import { ProductImage } from "./product-image";

/**
 * Mobile/tablet: full-bleed horizontal carousel with scroll snap and a counter.
 * Desktop (lg+): first image full width, the rest in a two-column grid.
 */
export function ProductGallery({ images }: { images: ProductImageData[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative -mx-[var(--gutter)] lg:mx-0">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        aria-label="Product images"
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:grid lg:snap-none lg:grid-cols-2 lg:gap-[var(--grid-gap-x)] lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <li
            key={`${image.src}-${i}`}
            className="relative aspect-[var(--aspect-product)] w-full shrink-0 snap-start overflow-hidden bg-canvas lg:first:col-span-2"
          >
            <ProductImage
              image={image}
              preload={i === 0}
              sizes={i === 0 ? "(min-width: 64rem) 58vw, 100vw" : "(min-width: 64rem) 29vw, 100vw"}
            />
          </li>
        ))}
      </ul>

      {images.length > 1 && (
        <p
          aria-hidden
          className="meta absolute right-[var(--gutter)] bottom-3 bg-paper/90 px-2 py-1 text-ink lg:hidden"
        >
          {index + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
