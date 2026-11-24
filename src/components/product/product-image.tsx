import Image from "next/image";

import type { ProductImage as ProductImageData } from "@/lib/products";

type Props = {
  image: ProductImageData;
  sizes: string;
  preload?: boolean;
};

/**
 * Fills its (relatively positioned) parent. Supports detail crops of the same
 * photo through `focus` (object-position) and `zoom` (scale around focus).
 */
export function ProductImage({ image, sizes, preload }: Props) {
  const zoom = image.zoom ?? 1;
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      preload={preload}
      className="object-cover"
      style={{
        objectPosition: image.focus,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: image.focus,
      }}
    />
  );
}
