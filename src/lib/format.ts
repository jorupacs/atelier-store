const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  // Cents only when there are any, so line totals visibly add up.
  trailingZeroDisplay: "stripIfInteger",
});

/** Formats an integer amount in cents, e.g. 245000 → "$2,450", 1999 → "$19.99". */
export function formatPrice(cents: number) {
  return currency.format(cents / 100);
}
