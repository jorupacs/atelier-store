import Image from "next/image";
import Link from "next/link";

import { editorial } from "@/lib/catalog";

export function EditorialFeature() {
  return (
    <section className="bg-canvas">
      <div className="grid-split items-center gap-0 md:gap-0">
        <div className="relative aspect-[var(--aspect-editorial)] md:aspect-auto md:h-full md:min-h-[40rem]">
          <Image
            src={editorial.image.src}
            alt={editorial.image.alt}
            fill
            sizes="(min-width: 48rem) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="px-[var(--gutter)] py-12 md:px-12 md:py-16 xl:px-24">
          <div className="stack max-w-md gap-5">
            <p className="eyebrow text-muted">{editorial.eyebrow}</p>
            <h2 className="text-display">{editorial.title}</h2>
            <p className="text-body-lg text-muted">{editorial.body}</p>
            <Link href={editorial.cta.href} className="btn btn-secondary mt-3 self-start">
              {editorial.cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
