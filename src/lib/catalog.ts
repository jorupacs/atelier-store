/**
 * Sample editorial content for the storefront homepage.
 * Product data lives in ./products.ts.
 *
 * This is placeholder content until products and collections come from the
 * database. Images are Unsplash photos (https://unsplash.com/license).
 */

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export type Image = {
  src: string;
  alt: string;
};

export type Collection = {
  slug: string;
  name: string;
  description: string;
  image: Image;
};

export const hero = {
  eyebrow: "Autumn–Winter 2026",
  title: "The Quiet Season",
  description:
    "Soft tailoring, sculpted outerwear and pieces made to be lived in.",
  image: {
    src: unsplash("1539109136881-3be0616acf4b"),
    alt: "Woman in a pale blue wool coat and scarf standing in a stone piazza",
  },
} as const;

export const collections: Collection[] = [
  {
    slug: "women",
    name: "Women",
    description: "Fluid dresses and considered layers.",
    image: {
      src: unsplash("1496747611176-843222e1e57c"),
      alt: "Floral wrap dress moving in the wind by the sea",
    },
  },
  {
    slug: "men",
    name: "Men",
    description: "Modern tailoring with an easy line.",
    image: {
      src: unsplash("1617137968427-85924c800a22"),
      alt: "Man in a navy two-piece suit and white shirt",
    },
  },
  {
    slug: "outerwear",
    name: "Outerwear",
    description: "Leather and wool built for the cold.",
    image: {
      src: unsplash("1539533018447-63fcce2678e3"),
      alt: "Woman in a belted camel wool coat on stone steps",
    },
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    description: "Gold, stone and quiet shine.",
    image: {
      src: unsplash("1617038220319-276d3cfab638"),
      alt: "Twisted gold hoop earrings resting on a pale stone",
    },
  },
];

export const editorial = {
  eyebrow: "The Atelier",
  title: "Made slowly, made to last",
  body: "Every piece begins with the material: undyed wool, vegetable-tanned leather, silk woven on narrow looms. We work in small runs with family workshops so that each garment carries the hand of the people who made it.",
  cta: { label: "Discover our craft", href: "/about" },
  image: {
    src: unsplash("1558769132-cb1aea458c5e"),
    alt: "Neutral knitwear hanging on a wooden rail beside dried pampas grass",
  },
} as const;

export const giftBanner = {
  eyebrow: "Holiday 2026",
  title: "The Gift Edit",
  description: "Thoughtful pieces, wrapped by hand.",
  cta: { label: "Shop gifts", href: "/collections/gifts" },
  image: {
    src: unsplash("1483985988355-763728e1935b"),
    alt: "Woman in a burgundy coat and sunglasses carrying shopping bags",
  },
} as const;

export const services = [
  {
    title: "Complimentary shipping",
    body: "Free express delivery on every order.",
  },
  {
    title: "Easy returns",
    body: "Return within 30 days, free of charge.",
  },
  {
    title: "Gift wrapping",
    body: "Signature packaging with a handwritten note.",
  },
  {
    title: "Client services",
    body: "Our advisors are here to help, seven days a week.",
  },
];

export const navigation = [
  { label: "New In", href: "/collections/new" },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Outerwear", href: "/collections/outerwear" },
  { label: "Jewelry", href: "/collections/jewelry" },
  { label: "Gifts", href: "/collections/gifts" },
];
