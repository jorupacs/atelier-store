import Image from "next/image";
import Link from "next/link";

import { giftBanner } from "@/lib/catalog";

export function GiftBanner() {
  return (
    <section className="container-page section-y">
      <div className="relative isolate flex min-h-[32rem] items-end md:min-h-[36rem] md:items-center overflow-hidden bg-ink">
        <Image
          src={giftBanner.image.src}
          alt={giftBanner.image.alt}
          fill
          sizes="(min-width: 90rem) 1360px, 100vw"
          className="-z-10 object-cover object-[70%_30%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/15 to-transparent md:bg-gradient-to-r md:from-black/55 md:via-black/20" />
        <div className="stack max-w-md gap-4 px-6 pt-12 pb-10 text-paper md:py-12 md:px-12 xl:px-16">
          <p className="eyebrow">{giftBanner.eyebrow}</p>
          <h2 className="text-display">{giftBanner.title}</h2>
          <p className="text-body-lg text-paper/85">{giftBanner.description}</p>
          <Link href={giftBanner.cta.href} className="btn btn-inverse mt-2 self-start">
            {giftBanner.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
