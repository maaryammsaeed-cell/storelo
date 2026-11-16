const FALLBACK_LOW_STOCK = 10;

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getStockState(product, options = {}) {
  const lowStockLimit = Math.max(
    0,
    Number(options.lowStockLimit ?? FALLBACK_LOW_STOCK)
  );
  const storeAllowBackorder = Boolean(options.allowBackorder);

  const status = product?.status || "active";
  const rawStock = product?.stock;
  const missing =
    rawStock === null || rawStock === undefined || rawStock === "";
  const stock = missing ? null : Number(rawStock);
  const invalid =
    stock !== null && (!Number.isFinite(stock) || stock < 0);

  const backorderAllowed =
    storeAllowBackorder && product?.allowBackorder === true;

  const base = {
    stock,
    status,
    lowStockLimit,
    canAddToCart: false,
    isPreorder: false,
    isBackorder: false,
  };

  // 1. Discontinued
  if (status === "discontinued") {
    return {
      ...base,
      state: "discontinued",
      label: "DISCONTINUED",
      message:
        "This product has been discontinued and is no longer available.",
    };
  }

  // 2. Temporarily unavailable
  if (status === "inactive") {
    return {
      ...base,
      state: "temporarily_unavailable",
      label: "TEMPORARILY UNAVAILABLE",
      message: "Temporarily unavailable. Please check back later.",
    };
  }

  // 3. Preorder — stock ki zaroorat nahi
  if (status === "preorder") {
    const dateText = formatDate(product?.preorderReleaseDate);
    return {
      ...base,
      state: "preorder",
      label: "PRE-ORDER",
      message: dateText
        ? `Available for pre-order — releases on ${dateText}`
        : "Available for pre-order.",
      canAddToCart: true,
      isPreorder: true,
    };
  }

  // 4. Stock info unavailable
  if (missing || invalid) {
    return {
      ...base,
      state: "unavailable",
      label: "UNAVAILABLE",
      message: "Stock information is unavailable. Please try again.",
    };
  }

  // 5. Available / Low stock
  if (stock > 0) {
    const low = stock <= lowStockLimit;
    return {
      ...base,
      state: low ? "low_stock" : "available",
      label: low ? "LOW STOCK" : "IN STOCK",
      message: low
        ? `Only ${stock} item${stock === 1 ? "" : "s"} left`
        : "In stock and ready to ship.",
      canAddToCart: true,
    };
  }

  // 6. Backorder
  if (stock === 0 && backorderAllowed) {
    return {
      ...base,
      state: "backorder",
      label: "BACKORDER",
      message: "Out of stock — available on backorder.",
      canAddToCart: true,
      isBackorder: true,
    };
  }

  // 7. Out of stock
  return {
    ...base,
    state: "out_of_stock",
    label: "OUT OF STOCK",
    message: "This item is currently out of stock.",
  };
}