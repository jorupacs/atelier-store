"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";

import { addToCart, type CartResult } from "@/app/bag/actions";
import { notifyCartChange } from "@/components/cart/use-cart-count";
import { getStockState, type Product } from "@/lib/products";

type Props = Pick<Product, "id" | "name" | "stock" | "sizes">;

type Status = "idle" | "needs_size" | "added" | "failed" | "notify";

/** Size selection and add-to-bag. The server checks stock and sets the price. */
export function PurchasePanel({ id, name, stock, sizes }: Props) {
  const soldOut = getStockState({ stock }).status === "out_of_stock";
  const [size, setSize] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Next keeps this page mounted but hidden after leaving it. Don't come back to
  // an old confirmation.
  useLayoutEffect(() => () => setStatus("idle"), []);

  const needsSize = !!sizes?.length;

  const addToBag = () => {
    if (needsSize && !size) {
      setStatus("needs_size");
      return;
    }
    if (pending) return;
    setStatus("idle");
    startTransition(async () => {
      let result: CartResult;
      try {
        result = await addToCart(id, size);
      } catch {
        result = { ok: false, error: "Something went wrong. Please try again." };
      }
      notifyCartChange();
      const message = result.ok ? "" : result.error;
      // State set after an await needs its own transition.
      startTransition(() => {
        setError(message);
        setStatus(message ? "failed" : "added");
      });
    });
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
        <button
          type="button"
          aria-disabled={pending}
          className="btn btn-primary btn-lg btn-block aria-disabled:opacity-70"
          onClick={addToBag}
        >
          {pending ? "Adding…" : "Add to bag"}
        </button>
      )}

      <p className="text-body-sm" role="status">
        {status === "added" && (
          <>
            {name}
            {size && `, size ${size},`} added to your bag.{" "}
            <Link href="/bag" className="link">
              View bag
            </Link>
          </>
        )}
        {status === "failed" && <span className="text-error">{error}</span>}
        {status === "notify" && "We'll let you know when it's back in stock."}
      </p>
    </div>
  );
}
