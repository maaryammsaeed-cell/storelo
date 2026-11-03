"use client";

import { useEffect, useState } from "react";

// Ek dafa settings se currency laata hai, phir yaad rakhta hai
let cached = null;

export function useCurrency() {
  const [currency, setCurrency] = useState(cached || "USD");

  useEffect(() => {
    if (cached) return;

    let active = true;

    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const value = data?.settings?.currency || "USD";
        cached = value;
        if (active) setCurrency(value);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return currency;
}