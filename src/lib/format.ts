const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats an integer amount in cents, e.g. 245000 → "$2,450". */
export function formatPrice(cents: number) {
  return currency.format(cents / 100);
}
