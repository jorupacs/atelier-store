"use client";

import { startTransition, useOptimistic, useRef, useState } from "react";

import { removeFromCart, setCartQuantity, type CartResult } from "@/app/bag/actions";
import { StockIndicator } from "@/components/product/stock-indicator";
import { MAX_QUANTITY, type CartLine } from "@/lib/cart";
import { useAnnounce } from "./bag-announcer";
import { BAG_HEADING_ID } from "./bag-heading";
import { QuantityStepper } from "./quantity-stepper";
import { notifyCartChange } from "./use-cart-count";

type Props = Pick<CartLine, "productId" | "size" | "quantity" | "available" | "status"> & {
  name: string;
};

type Activity = "idle" | "updating" | "removing";

async function attempt(action: () => Promise<CartResult>): Promise<CartResult> {
  try {
    return await action();
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  } finally {
    notifyCartChange();
  }
}

/** Quantity, stock state and remove for one line of the bag. */
export function LineControls({ productId, size, quantity, available, status, name }: Props) {
  const announce = useAnnounce();
  const [shown, setShown] = useOptimistic(quantity);
  const [activity, setActivity] = useOptimistic<Activity>("idle");
  const [error, setError] = useState<string | null>(null);

  /** The quantity to send next, and the run that is sending. */
  const wanted = useRef<number | null>(null);
  const running = useRef<Promise<CartResult> | null>(null);

  const label = size ? `${name}, size ${size}` : name;
  const max = Math.min(available, MAX_QUANTITY);
  const adjustable = status === "ok" || status === "reduced";

  const report = (result: CartResult, done: string) =>
    // State set after an await needs its own transition.
    startTransition(() => {
      setError(result.ok ? null : result.error);
      announce(result.ok ? done : result.error);
    });

  /** Sends only the latest quantity, however many clicks arrive meanwhile. */
  const sendWanted = async (): Promise<CartResult> => {
    let result: CartResult = { ok: true };
    while (wanted.current !== null && result.ok) {
      const next = wanted.current;
      wanted.current = null;
      result = await attempt(() => setCartQuantity(productId, size, next));
      report(result, `${label}, quantity ${next}.`);
    }
    wanted.current = null;
    return result;
  };

  const setQuantity = (next: number) => {
    if (activity === "removing") return;
    wanted.current = next;
    startTransition(async () => {
      setActivity("updating");
      setShown(next);
      running.current ??= sendWanted().finally(() => {
        running.current = null;
      });
      // Keeps the number shown until the run it belongs to has finished.
      await running.current;
    });
  };

  const remove = () => {
    if (activity === "removing") return;
    wanted.current = null;
    startTransition(async () => {
      setActivity("removing");
      await running.current;
      const result = await attempt(() => removeFromCart(productId, size));
      report(result, `${label} removed from your bag.`);
      // This line, and the button that has focus, are about to disappear.
      if (result.ok) document.getElementById(BAG_HEADING_ID)?.focus();
    });
  };

  return (
    <div
      className="stack gap-3"
      data-pending={activity === "idle" ? undefined : ""}
      data-removing={activity === "removing" ? "" : undefined}
    >
      {status === "reduced" && (
        <p className="text-body-sm text-error">
          You have {quantity} in your bag, but only {available} {available === 1 ? "is" : "are"}{" "}
          left.{" "}
          <button type="button" className="link cursor-pointer" onClick={() => setQuantity(max)}>
            Update to {max}
          </button>
        </p>
      )}

      {status === "ok" &&
        (shown < max ? (
          <StockIndicator product={{ stock: available }} />
        ) : (
          // Explains why the quantity can't go higher.
          <p className="text-body-sm text-muted">
            {available > MAX_QUANTITY
              ? `You can order up to ${MAX_QUANTITY}`
              : available === 1
                ? "This is the last one"
                : `You have all ${available} available`}
          </p>
        ))}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {adjustable && (
          <QuantityStepper label={label} value={shown} max={max} onChange={setQuantity} />
        )}
        <button
          type="button"
          aria-label={`Remove ${label}`}
          aria-disabled={activity === "removing"}
          onClick={remove}
          className="link link-muted min-h-11 cursor-pointer text-body-sm"
        >
          {activity === "removing" ? "Removing…" : "Remove"}
        </button>
      </div>

      {error && <p className="text-body-sm text-error">{error}</p>}
    </div>
  );
}
