import Image from "next/image";
import Link from "next/link";

import { hero } from "@/lib/catalog";

export function Hero() {
  return (
    <section className="relative isolate h-[calc(100svh-var(--header-h))] min-h-[32rem] max-h-[60rem] overflow-hidden bg-ink">
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        preload
        quality={85}
        sizes="100vw"
        className="-z-10 object-cover object-[50%_30%]"
      />
      {/* Bottom scrim keeps text legible over any image. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="container-page flex h-full flex-col justify-end pb-12 text-paper md:pb-16 xl:pb-20">
        <div className="stack max-w-xl gap-4 md:gap-5">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="text-display-lg">{hero.title}</h1>
          <p className="text-body-lg text-paper/85">{hero.description}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/collections/women" className="btn btn-inverse">
              Shop women
            </Link>
            <Link
              href="/collections/men"
              className="btn border-paper text-paper hover:bg-paper hover:text-ink"
            >
              Shop men
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
