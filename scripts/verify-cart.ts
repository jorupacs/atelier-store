/**
 * Verifies cart rules and the bag page against a running local server.
 *
 *   npm run test:cart
 *   BASE_URL=http://localhost:3918 npm run test:cart
 *
 * The server must use the database in .env. Creates uniquely named products and
 * deletes exactly those at the end, so real stock isn't touched.
 */

import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { and, eq, inArray, isNull, like } from "drizzle-orm";

import { db } from "../src/db";
import { categories, products, productStock } from "../src/db/schema";
import {
  buildCart,
  countItems,
  MAX_LINES,
  MAX_QUANTITY,
  parseCart,
  parseQuantity,
  parseVariant,
  serializeCart,
  type CartProduct,
} from "../src/lib/cart";
import { formatPrice } from "../src/lib/format";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(BASE).hostname), "Local servers only");

const RUN = `cart-check-${Date.now()}`;

async function createProduct(name: string, price: number, stock: [string | null, number][]) {
  const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
  const [row] = await db
    .insert(products)
    .values({
      slug: `${RUN}-${name}`,
      sku: `${RUN}-${name}`,
      name: `Check ${name}`,
      detail: "Test",
      price,
      categoryId: category.id,
      description: "Test",
      // Listings may show these while the script runs: cards need an image, and
      // an old date keeps them out of new arrivals on the homepage.
      images: [{ src: "https://images.unsplash.com/photo-1524592094714-0f0654e20314", alt: "Test" }],
      createdAt: new Date(0),
    })
    .returning({ id: products.id });
  await db
    .insert(productStock)
    .values(stock.map(([size, quantity], position) => ({ productId: row.id, size, quantity, position })));
  return row.id;
}

const setStock = (id: number, size: string | null, quantity: number) =>
  db
    .update(productStock)
    .set({ quantity })
    .where(
      and(
        eq(productStock.productId, id),
        size === null ? isNull(productStock.size) : eq(productStock.size, size),
      ),
    );

let sized: number;
let single: number;

before(async () => {
  sized = await createProduct("sized", 10_050, [["S", 2], ["M", 5], ["L", 0]]);
  single = await createProduct("single", 1_999, [[null, 4]]);
});

after(async () => {
  const mine = await db.select({ id: products.id }).from(products).where(like(products.slug, `${RUN}-%`));
  if (mine.length) await db.delete(products).where(inArray(products.id, mine.map((p) => p.id)));
  const left = await db.select({ id: products.id }).from(products).where(like(products.slug, `${RUN}-%`));
  console.log(`Deleted ${mine.length} test products, ${left.length} left`);
  assert.equal(left.length, 0);
});

/** The bag as the server renders it for a given cookie. */
async function bag(cookie: unknown) {
  const value = typeof cookie === "string" ? cookie : JSON.stringify(cookie);
  const res = await fetch(`${BASE}/bag`, { headers: { cookie: `cart=${encodeURIComponent(value)}` } });
  assert.equal(res.status, 200);
  const html = (await res.text()).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--.*?-->/g, "");
  return {
    html,
    text: html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " "),
    subtotal: /data-testid="subtotal"[^>]*>([^<]+)</.exec(html)?.[1],
  };
}

test("cookie parsing drops anything invalid", () => {
  for (const bad of [undefined, "", "nope", "{}", "null", "1", '"x"', "[1,2]", "[[1]]", '[[1,"M"]]']) {
    assert.deepEqual(parseCart(bad), [], String(bad));
  }
  const invalid = [
    [0, null, 1], [-1, null, 1], [1.5, null, 1], ["1", null, 1], [2_147_483_648, null, 1], [1e99, null, 1],
    [1, "", 1], [1, 5, 1], [1, "x".repeat(21), 1], [1, {}, 1],
    [1, null, 0], [1, null, -3], [1, null, 1.5], [1, null, "2"], [1, null, null],
    [1, null, 1, 99], // an extra value, such as a price
  ];
  assert.deepEqual(parseCart(JSON.stringify(invalid)), []);
});

test("cookie parsing merges repeats and applies limits", () => {
  assert.deepEqual(parseCart('[[1,"M",1],[1,"M",2],[1,"S",1]]'), [
    { productId: 1, size: "M", quantity: 3 },
    { productId: 1, size: "S", quantity: 1 },
  ]);
  assert.equal(parseCart("[[1,null,5000]]")[0].quantity, MAX_QUANTITY);
  const many = Array.from({ length: 50 }, (_, i) => [i + 1, null, 1]);
  assert.equal(parseCart(JSON.stringify(many)).length, MAX_LINES);
});

test("carts survive a round trip, and a full one fits in a cookie", () => {
  const full = Array.from({ length: MAX_LINES }, (_, i) => ({ productId: 100_000 + i, size: "XXL", quantity: 99 }));
  assert.deepEqual(parseCart(serializeCart(full)), full);
  assert.equal(countItems(full), MAX_LINES * 99);
  assert.ok(encodeURIComponent(serializeCart(full)).length < 3500);
});

test("action input is validated", () => {
  for (const id of ["1", null, undefined, 0, -1, 1.2, NaN, Infinity, {}, 2_147_483_648]) {
    assert.equal(parseVariant(id, null), null);
  }
  for (const size of ["", 1, undefined, {}, "x".repeat(21)]) assert.equal(parseVariant(1, size), null);
  for (const q of [0, -1, 1.5, "2", null, NaN, Infinity, MAX_QUANTITY + 1]) assert.equal(parseQuantity(q), null);
  assert.equal(parseQuantity(MAX_QUANTITY), MAX_QUANTITY);
});

test("totals use integer cents and count only what's in stock", () => {
  const product = (id: number, price: number, stock: CartProduct["stock"]): CartProduct => ({
    id, price, stock, slug: "s", name: "n", detail: "d", image: undefined,
  });
  const cart = buildCart(
    [
      { productId: 1, size: "M", quantity: 3 },
      { productId: 2, size: null, quantity: 5 },
      { productId: 3, size: null, quantity: 1 },
      { productId: 1, size: "XS", quantity: 1 },
      { productId: 9, size: null, quantity: 1 },
    ],
    [
      product(1, 1_010, [{ size: "M", quantity: 3 }]),
      product(2, 1_999, [{ size: null, quantity: 2 }]),
      product(3, 500, [{ size: null, quantity: 0 }]),
    ],
  );
  assert.deepEqual(cart.lines.map((l) => l.status), ["ok", "reduced", "sold_out", "unavailable", "unavailable"]);
  assert.deepEqual(cart.lines.map((l) => l.total), [3_030, 3_998, 0, 0, 0]);
  assert.equal(cart.subtotal, 7_028);
  assert.equal(cart.count, 5);
  assert.equal(cart.hasIssues, true);
});

test("another size is suggested only if one is in stock", () => {
  const product = (stock: CartProduct["stock"]): CartProduct => ({
    id: 1, price: 100, stock, slug: "s", name: "n", detail: "d", image: undefined,
  });
  const suggests = (size: string | null, stock: CartProduct["stock"]) =>
    buildCart([{ productId: 1, size, quantity: 1 }], [product(stock)]).lines[0].hasOtherSizes;
  assert.equal(suggests("S", [{ size: "S", quantity: 0 }, { size: "M", quantity: 1 }]), true);
  assert.equal(suggests("S", [{ size: "S", quantity: 0 }, { size: "M", quantity: 0 }]), false);
  assert.equal(suggests("S", [{ size: "S", quantity: 4 }, { size: "M", quantity: 0 }]), false);
  assert.equal(suggests("XXL", [{ size: "M", quantity: 1 }]), true);
  assert.equal(suggests(null, [{ size: null, quantity: 0 }]), false);
});

test("prices show cents only when there are any", () => {
  assert.equal(formatPrice(245_000), "$2,450");
  assert.equal(formatPrice(1_999), "$19.99");
  assert.equal(formatPrice(1_010), "$10.10");
});

test("bag: empty and malformed cookies show an empty bag", async () => {
  for (const cookie of ["", "garbage", "[[", "[[99999999999,null,1]]"]) {
    assert.match((await bag(cookie)).text, /Your bag is empty/);
  }
});

test("bag: subtotal across sizes and products", async () => {
  const { subtotal, text } = await bag([[sized, "S", 2], [sized, "M", 1], [single, null, 3]]);
  assert.equal(subtotal, "$361.47"); // 3 × 100.50 + 3 × 19.99
  assert.match(text, /\(\s*6 items\s*\)/);
  assert.doesNotMatch(text, /needs? your attention/);
});

test("bag: an edited cookie can't buy more than the stock of that size, or set a price", async () => {
  const over = await bag([[sized, "S", 999]]);
  assert.match(over.text, /You have 99 in your bag, but only 2 are left/);
  assert.equal(over.subtotal, "$201");
  assert.match((await bag([[single, null, 1, 1]])).text, /Your bag is empty/, "extra price value");
  const objects = await bag([{ productId: single, size: null, quantity: 1, price: 1 }]);
  assert.match(objects.text, /Your bag is empty/, "object with a price");
});

test("bag: a size that doesn't exist or is sold out isn't counted", async () => {
  const { text, subtotal } = await bag([[sized, "XXL", 1], [sized, null, 1], [sized, "L", 1], [single, "M", 1]]);
  assert.equal(text.match(/no longer available/g)?.length, 3);
  assert.equal(text.match(/Size L has sold out/g)?.length, 1);
  assert.match(text, /4 items need your attention/);
  assert.equal(subtotal, "$0");
});

test("bag: price and stock changes apply on the next load", async () => {
  const cookie = [[single, null, 3]];
  assert.equal((await bag(cookie)).subtotal, "$59.97");

  await db.update(products).set({ price: 2_500 }).where(eq(products.id, single));
  assert.equal((await bag(cookie)).subtotal, "$75");

  await setStock(single, null, 2);
  const reduced = await bag(cookie);
  assert.match(reduced.text, /only 2 are left/);
  assert.match(reduced.text, /Update to 2/);
  assert.equal(reduced.subtotal, "$50");

  await setStock(single, null, 0);
  const soldOut = await bag(cookie);
  assert.match(soldOut.text, /This piece has sold out/);
  assert.equal(soldOut.subtotal, "$0");
  await setStock(single, null, 4);
});

test("bag: a deleted product stays visible so it can be removed", async () => {
  const gone = await createProduct("gone", 5_000, [[null, 1]]);
  await db.delete(products).where(eq(products.id, gone));
  const { text, subtotal } = await bag([[gone, null, 1], [single, null, 1]]);
  assert.match(text, /no longer available/);
  assert.match(text, /Remove/);
  assert.equal(subtotal, "$25");
});
