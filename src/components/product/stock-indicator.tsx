import { getStockState, type Product } from "@/lib/products";

const dotColor = {
  in_stock: "bg-success",
  low_stock: "bg-sale",
  out_of_stock: "bg-subtle",
} as const;

export function StockIndicator({ product }: { product: Pick<Product, "stock"> }) {
  const state = getStockState(product);
  return (
    <p className="flex items-center gap-2 text-body-sm">
      <span aria-hidden className={`size-1.5 rounded-pill ${dotColor[state.status]}`} />
      <span className={state.status === "out_of_stock" ? "text-muted" : undefined}>
        {state.label}
      </span>
    </p>
  );
}
