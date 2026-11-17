"use client";

import { useEffect, useSyncExternalStore } from "react";

// Sab components ek hi memory copy padhte hain.
// EMPTY ka reference kabhi nahi badalta — warna React loop me phans jata hai.
const EMPTY = [];
let cache = EMPTY;
const listeners = new Set(); // jin components ko update karna hai

function publish(items) {
  cache = Array.isArray(items) ? items : EMPTY;
  listeners.forEach((notify) => notify());
}

function subscribe(notify) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

function getSnapshot() {
  return cache;
}

// Server par cart khali dikhta hai — hydration mismatch nahi hota
function getServerSnapshot() {
  return EMPTY;
}

// Server se baat karne ka ek hi darwaza
async function callApi(url, options = {}) {
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "CART_ERROR");
  }

  publish(data?.items || []);
  return data;
}

// Page khulte waqt sirf ek dafa cart load karo (kitne bhi components ho)
let loadPromise = null;

function load() {
  if (!loadPromise) {
    loadPromise = callApi("/api/cart").catch(() => {
      publish(EMPTY);
    });
  }

  return loadPromise;
}

export function useCart() {
  // Module-level store ko React se jodo (setState-in-effect ki zaroorat nahi)
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    load();
  }, []);

  async function addToCart(product, quantity = 1) {
    // product object ya seedha id — dono chalega
    const productId =
      typeof product === "string" ? product : product?.id || product?._id


    if (!productId) throw new Error("PRODUCT_ID_MISSING");

    return callApi("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async function removeFromCart(id) {
    return callApi(`/api/cart?productId=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async function changeQuantity(id, delta) {
    return callApi("/api/cart", {
      method: "PATCH",
      body: JSON.stringify({ productId: id, delta }),
    });
  }

  async function clearCart() {
    return callApi("/api/cart", { method: "DELETE" });
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return {
    items,
    count,
    total,
    addToCart,
    removeFromCart,
    changeQuantity,
    clearCart,
  };
}
