/**
 * Seeds categories, products and stock with the storefront's sample catalog.
 *
 *   npm run db:seed
 *
 * Idempotent: categories and products are upserted on `slug`, and each seeded
 * product's stock rows are replaced. Everything runs in a single `db.batch`,
 * which the Neon HTTP driver executes as one transaction.
 *
 * Images are Unsplash photos (https://unsplash.com/license). Prices are in cents.
 */

import { inArray, sql, type SQL } from "drizzle-orm";

import type { ProductImage } from "../lib/products";
import { db } from "./index";
import { categories, products, productStock } from "./schema";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

const categoryData = [
  { slug: "outerwear", name: "Outerwear" },
  { slug: "dresses", name: "Dresses" },
  { slug: "tailoring", name: "Tailoring" },
  { slug: "watches", name: "Watches" },
  { slug: "eyewear", name: "Eyewear" },
  { slug: "shoes", name: "Shoes" },
  { slug: "jewelry", name: "Jewelry" },
] as const;

type CategorySlug = (typeof categoryData)[number]["slug"];

type SeedProduct = {
  slug: string;
  sku: string;
  name: string;
  detail: string;
  price: number;
  category: CategorySlug;
  badge?: "New" | "Exclusive";
  /** Units per size in display order, or a single number for one-size items. */
  stock: Record<string, number> | number;
  description: string;
  details: string[];
  care: string[];
  images: ProductImage[];
};

/** Listed newest first: this order becomes the "new arrivals" order. */
const productData: SeedProduct[] = [
  {
    slug: "leather-biker-jacket",
    sku: "AT-OW-0142",
    name: "Leather Biker Jacket",
    detail: "Black lambskin",
    price: 289000,
    category: "outerwear",
    badge: "New",
    stock: { XS: 0, S: 2, M: 3, L: 2, XL: 2 },
    description:
      "A classic biker silhouette cut from supple, vegetable-tanned lambskin. Asymmetric front zip, notched lapels and a fitted waist that softens with wear.",
    details: [
      "100% lambskin leather",
      "Cupro lining",
      "Asymmetric zip closure",
      "Three zip pockets",
      "Made in Italy",
    ],
    care: ["Specialist leather clean only", "Store on a padded hanger"],
    images: [
      {
        src: unsplash("1520975954732-35dd22299614"),
        alt: "Man wearing a black leather biker jacket",
      },
      {
        src: unsplash("1520975954732-35dd22299614"),
        alt: "Close-up of the jacket's asymmetric zip and lapel",
        focus: "62% 42%",
        zoom: 2.2,
      },
      {
        src: unsplash("1520975954732-35dd22299614"),
        alt: "Detail of the jacket's sleeve and cuff",
        focus: "70% 65%",
        zoom: 2,
      },
    ],
  },
  {
    slug: "silk-column-gown",
    sku: "AT-DR-0310",
    name: "Silk Column Gown",
    detail: "Scarlet silk crepe",
    price: 420000,
    category: "dresses",
    badge: "Exclusive",
    stock: { XS: 0, S: 1, M: 1, L: 0, XL: 0 },
    description:
      "A floor-length column of heavy silk crepe with a high neckline and open back. The bias-cut skirt moves with every step.",
    details: [
      "100% silk crepe",
      "Concealed back zip",
      "Bias-cut skirt",
      "Fully lined",
      "Made in Italy",
    ],
    care: ["Dry clean only", "Steam on low heat"],
    images: [
      {
        src: unsplash("1595777457583-95e059d581b8"),
        alt: "Woman wearing a flowing scarlet silk gown",
      },
      {
        src: unsplash("1595777457583-95e059d581b8"),
        alt: "Detail of the gown's bodice and neckline",
        focus: "50% 20%",
        zoom: 2,
      },
    ],
  },
  {
    slug: "tailored-wool-suit",
    sku: "AT-TL-0207",
    name: "Tailored Wool Suit",
    detail: "Midnight wool twill",
    price: 365000,
    category: "tailoring",
    stock: { "46": 3, "48": 4, "50": 4, "52": 0, "54": 3 },
    description:
      "A two-piece suit in fine wool twill, with a soft-shouldered single-breasted jacket and straight-leg trousers. Half-canvassed for a natural drape.",
    details: [
      "100% virgin wool",
      "Half-canvas construction",
      "Two-button jacket, notch lapel",
      "Flat-front trousers",
      "Made in Italy",
    ],
    care: ["Dry clean only", "Brush after wear"],
    images: [
      {
        src: unsplash("1507679799987-c73779587ccf"),
        alt: "Man buttoning a dark tailored suit jacket",
      },
      {
        src: unsplash("1617137968427-85924c800a22"),
        alt: "Man wearing a navy two-piece suit",
      },
      {
        src: unsplash("1507679799987-c73779587ccf"),
        alt: "Close-up of the jacket button and cuff",
        focus: "50% 60%",
        zoom: 2,
      },
    ],
  },
  {
    slug: "minimal-leather-watch",
    sku: "AT-WT-0051",
    name: "Minimal Leather Watch",
    detail: "Rose gold, taupe strap",
    price: 185000,
    category: "watches",
    badge: "New",
    stock: 6,
    description:
      "A 36mm case in rose-gold-plated steel with a clean white dial and slim baton indices, on a soft calfskin strap.",
    details: [
      "36mm rose-gold-plated steel case",
      "Swiss quartz movement",
      "Sapphire crystal",
      "Calfskin strap, pin buckle",
      "Water resistant to 30m",
    ],
    care: ["Avoid prolonged contact with water", "Wipe with a soft dry cloth"],
    images: [
      {
        src: unsplash("1524592094714-0f0654e20314"),
        alt: "Hand holding a minimal watch with a taupe leather strap",
      },
      {
        src: unsplash("1524592094714-0f0654e20314"),
        alt: "Close-up of the white dial and rose-gold case",
        focus: "50% 45%",
        zoom: 2.2,
      },
    ],
  },
  {
    slug: "round-metal-sunglasses",
    sku: "AT-EY-0018",
    name: "Round Metal Sunglasses",
    detail: "Gold frame, green lens",
    price: 54000,
    category: "eyewear",
    stock: 22,
    description:
      "A fine round frame in gold-tone metal with adjustable nose pads and tinted green lenses that offer full UV protection.",
    details: [
      "Gold-tone metal frame",
      "Green mineral lenses",
      "100% UVA/UVB protection",
      "Includes leather case",
    ],
    care: ["Clean with the microfiber cloth provided"],
    images: [
      {
        src: unsplash("1511499767150-a48a237f0083"),
        alt: "Round gold-framed sunglasses on marble",
      },
      {
        src: unsplash("1511499767150-a48a237f0083"),
        alt: "Detail of the bridge and nose pads",
        focus: "50% 50%",
        zoom: 2,
      },
    ],
  },
  {
    slug: "suede-court-pump",
    sku: "AT-SH-0241",
    name: "Suede Court Pump",
    detail: "Ink blue suede, 85mm",
    price: 79000,
    category: "shoes",
    stock: { "36": 0, "37": 0, "38": 0, "39": 0, "40": 0, "41": 0 },
    description:
      "A rounded court shoe in soft suede on a sculpted 85mm heel, cushioned for all-day wear.",
    details: [
      "Calf suede upper",
      "Leather lining and sole",
      "85mm heel",
      "Made in Italy",
    ],
    care: ["Brush with a suede brush", "Store in the dust bag provided"],
    images: [
      {
        src: unsplash("1515347619252-60a4bf4fff4f"),
        alt: "Hand holding a pair of ink blue suede court pumps",
      },
    ],
  },
  {
    slug: "sapphire-drop-earrings",
    sku: "AT-JW-0412",
    name: "Sapphire Drop Earrings",
    detail: "Crystal and blue stone",
    price: 76000,
    category: "jewelry",
    badge: "New",
    stock: 3,
    description:
      "Statement drop earrings set with a pear-cut blue stone framed by baguette and round crystals.",
    details: [
      "Rhodium-plated brass",
      "Glass crystals, blue pear-cut stone",
      "Post back fastening",
      "Length 5.5cm",
    ],
    care: ["Avoid contact with perfume and water", "Store in the pouch provided"],
    images: [
      {
        src: unsplash("1599643478518-a784e5dc4c8f"),
        alt: "Crystal drop earrings with blue stones on a green leaf",
      },
      {
        src: unsplash("1599643478518-a784e5dc4c8f"),
        alt: "Close-up of the pear-cut blue stone",
        focus: "55% 60%",
        zoom: 2.2,
      },
    ],
  },
  {
    slug: "layered-pendant-necklace",
    sku: "AT-JW-0398",
    name: "Layered Pendant Necklace",
    detail: "Gold chain, blue crystal",
    price: 62000,
    category: "jewelry",
    stock: 11,
    description:
      "Two fine gold chains worn together: one with a faceted blue crystal, the other with an open crescent pendant.",
    details: [
      "18k gold-plated brass",
      "Faceted glass crystal",
      "Lobster clasp",
      "Lengths 42cm and 50cm",
    ],
    care: ["Avoid contact with perfume and water", "Store in the pouch provided"],
    images: [
      {
        src: unsplash("1535632066927-ab7c9ab60908"),
        alt: "Layered gold necklaces with a blue crystal pendant",
      },
      {
        src: unsplash("1535632066927-ab7c9ab60908"),
        alt: "Close-up of the faceted blue crystal pendant",
        focus: "50% 15%",
        zoom: 2.2,
      },
    ],
  },
  {
    slug: "belted-wool-coat",
    sku: "AT-OW-0158",
    name: "Belted Wool Coat",
    detail: "Camel double-face wool",
    price: 315000,
    category: "outerwear",
    stock: { XS: 1, S: 2, M: 2, L: 2, XL: 0 },
    description:
      "An unstructured wrap coat in double-face wool, with dropped shoulders and a tie belt. Hand-finished seams keep it light.",
    details: [
      "90% wool, 10% cashmere",
      "Unlined, hand-finished seams",
      "Removable tie belt",
      "Made in Italy",
    ],
    care: ["Dry clean only", "Store on a wide hanger"],
    images: [
      {
        src: unsplash("1539533018447-63fcce2678e3"),
        alt: "Woman wearing a belted camel wool coat on stone steps",
      },
      {
        src: unsplash("1539533018447-63fcce2678e3"),
        alt: "Detail of the coat's tie belt",
        focus: "50% 40%",
        zoom: 2,
      },
    ],
  },
  {
    slug: "crystal-heart-earrings",
    sku: "AT-JW-0420",
    name: "Crystal Heart Earrings",
    detail: "Gold hooks, blue crystal",
    price: 32000,
    category: "jewelry",
    stock: 18,
    description:
      "Small heart-cut crystals on fine gold hooks. Light enough for every day.",
    details: ["18k gold-plated brass", "Heart-cut glass crystal", "Hook fastening"],
    care: ["Avoid contact with perfume and water", "Store in the pouch provided"],
    images: [
      {
        src: unsplash("1630019852942-f89202989a59"),
        alt: "Blue heart crystal earrings on gold hooks resting on white fabric",
      },
    ],
  },
];

type StockRow = { productId: SQL; size: string | null; position: number; quantity: number };

const categoryId = (slug: string) => sql`(select id from ${categories} where slug = ${slug})`;
const productId = (slug: string) => sql`(select id from ${products} where slug = ${slug})`;

async function main() {
  const now = Date.now();
  const slugs = productData.map((p) => p.slug);

  const productRows = productData.map((p, i) => ({
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    detail: p.detail,
    price: p.price,
    categoryId: categoryId(p.category),
    badge: p.badge ?? null,
    description: p.description,
    details: p.details,
    care: p.care,
    images: p.images,
    // Stagger creation times so newest-first matches the list order.
    createdAt: new Date(now - i * 60_000),
  }));

  const stockRows = productData.flatMap((p): StockRow[] =>
    typeof p.stock === "number"
      ? [{ productId: productId(p.slug), size: null, position: 0, quantity: p.stock }]
      : Object.entries(p.stock).map(([size, quantity], position) => ({
          productId: productId(p.slug),
          size,
          position,
          quantity,
        })),
  );

  const excluded = (column: string) => sql.raw(`excluded.${column}`);

  await db.batch([
    db
      .insert(categories)
      .values([...categoryData])
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: excluded("name"), updatedAt: new Date() },
      }),
    db
      .insert(products)
      .values(productRows)
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          sku: excluded("sku"),
          name: excluded("name"),
          detail: excluded("detail"),
          price: excluded("price"),
          categoryId: excluded("category_id"),
          badge: excluded("badge"),
          description: excluded("description"),
          details: excluded("details"),
          care: excluded("care"),
          images: excluded("images"),
          createdAt: excluded("created_at"),
          updatedAt: new Date(),
        },
      }),
    db
      .delete(productStock)
      .where(
        inArray(
          productStock.productId,
          db.select({ id: products.id }).from(products).where(inArray(products.slug, slugs)),
        ),
      ),
    db.insert(productStock).values(stockRows),
  ]);

  console.log(
    `Seeded ${categoryData.length} categories, ${productData.length} products, ${stockRows.length} stock rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
