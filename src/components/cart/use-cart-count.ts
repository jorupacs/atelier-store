"use client";

import { useSyncExternalStore } from "react";

import { CART_COOKIE, countItems, parseCart } from "@/lib/cart";

const CHANGE_EVENT = "cart-change";

/** Call after a cart action, once its cookie has been set. */
export function notifyCartChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  // Returning to the tab picks up changes made in another one.
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("focus", onChange);
  window.addEventListener("pageshow", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
    window.removeEventListener("pageshow", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getCount() {
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${CART_COOKIE}=`));
  if (!entry) return 0;
  try {
    return countItems(parseCart(decodeURIComponent(entry.slice(CART_COOKIE.length + 1))));
  } catch {
    return 0;
  }
}

/** Units in the bag. Read in the browser so that pages showing it stay static. */
export function useCartCount() {
  return useSyncExternalStore(subscribe, getCount, () => 0);
}
