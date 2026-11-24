import { CollectionGrid } from "@/components/home/collection-grid";
import { EditorialFeature } from "@/components/home/editorial-feature";
import { GiftBanner } from "@/components/home/gift-banner";
import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { Newsletter } from "@/components/home/newsletter";
import { Services } from "@/components/home/services";

export default function Home() {
  return (
    <>
      <Hero />
      <CollectionGrid />
      <NewArrivals />
      <EditorialFeature />
      <GiftBanner />
      <Services />
      <Newsletter />
    </>
  );
}
