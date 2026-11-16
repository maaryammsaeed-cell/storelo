"use client";

import { useEffect, useState } from "react";

let cache = null;

export function useStoreSettings() {
  const [settings, setSettings] = useState(
    cache || { lowStockLimit: 10, allowBackorder: false }
  );

  useEffect(() => {
    // Cache sirf pehle render ke liye hai.
    // Har mount par fresh settings laao — warna Settings save karne ke baad
    // purani value dikhti rehti hai.
    let active = true;

    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const next = {
          lowStockLimit: Number(data?.settings?.lowStockLimit ?? 10),
          allowBackorder: data?.settings?.allowBackorder === true,
        };
        cache = next;
        if (active) setSettings(next);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return settings;
}