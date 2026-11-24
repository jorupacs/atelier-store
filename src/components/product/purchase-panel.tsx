"use client";

import { useState } from "react";

import { getStockState, type Product } from "@/lib/products";

type Props = Pick<Product, "name" | "stock" | "sizes">;

/**
 * Size selection and add-to-bag.
 * UI only: the bag/cart is not implemented yet, so adding shows a confirmation.
 */
export function PurchasePanel({ name, stock, sizes }: Props) {
  const soldOut = getStockState({ stock }).status === "out_of_stock";
  const [size, setSize] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "needs_size" | "added" | "notify">("idle");

  const needsSize = !!sizes?.length;

  const addToBag = () => {
    if (needsSize && !size) {
      setStatus("needs_size");
      return;
    }
    setStatus("added");
  };

  return (
    <div className="stack gap-5">
      {needsSize && (
        <fieldset className="stack gap-3" disabled={soldOut}>
          <div className="flex items-baseline justify-between">
            <legend className="eyebrow">Size{size ? `: ${size}` : ""}</legend>
            <button type="button" className="btn btn-ghost meta text-ink">
              Size guide
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
            {sizes!.map((s) => {
              const selected = size === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={!s.available}
                  aria-pressed={selected}
                  aria-label={s.available ? `Size ${s.label}` : `Size ${s.label}, unavailable`}
                  onClick={() => {
                    setSize(s.label);
                    setStatus("idle");
                  }}
                  className={`h-11 border text-body-sm transition-colors duration-[var(--duration-fast)] ${
                    selected
                      ? "border-ink bg-ink text-paper"
                      : "border-line hover:border-ink"
                  } disabled:cursor-not-allowed disabled:border-line disabled:text-subtle disabled:line-through disabled:hover:border-line`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {status === "needs_size" && (
            <p className="text-body-sm text-error" role="alert">
              Please select a size.
            </p>
          )}
        </fieldset>
      )}

      {soldOut ? (
        <div className="stack gap-3">
          <button type="button" className="btn btn-primary btn-block" disabled>
            Sold out
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => setStatus("notify")}
          >
            Notify me when available
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={addToBag}>
          Add to bag
        </button>
      )}

      <p className="text-body-sm" role="status">
        {status === "added" && `${name}${size ? `, size ${size},` : ""} added to your bag.`}
        {status === "notify" && "We'll let you know when it's back in stock."}
      </p>
    </div>
  );
}
