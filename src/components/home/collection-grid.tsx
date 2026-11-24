import Image from "next/image";
import Link from "next/link";

import { collections } from "@/lib/catalog";
import { SectionHeading } from "./section-heading";

export function CollectionGrid() {
  return (
    <section className="container-page section-y">
      <SectionHeading eyebrow="Explore" title="Shop the collections" />
      <ul
        className="grid grid-cols-2 gap-x-[var(--grid-gap-x)] gap-y-8 lg:grid-cols-4"
      >
        {collections.map((c) => (
          <li key={c.slug} className="group relative">
            <div className="relative aspect-[var(--aspect-editorial)] overflow-hidden bg-canvas">
              <Image
                src={c.image.src}
                alt={c.image.alt}
                fill
                sizes="(min-width: 64rem) 25vw, 50vw"
                className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-4 stack gap-1.5">
              <h3 className="text-heading-sm">
                <Link href={`/collections/${c.slug}`} className="after:absolute after:inset-0">
                  {c.name}
                </Link>
              </h3>
              <p className="meta hidden sm:block">{c.description}</p>
              <span className="eyebrow mt-1 underline decoration-transparent underline-offset-[0.35em] transition-colors group-hover:decoration-current">
                Shop now
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
