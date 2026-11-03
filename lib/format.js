// Price ko settings wali currency me dikhata hai.
// formatPrice(75, "PKR")  ->  "PKR 75.00"
export function formatPrice(value, currency = "USD", locale = "en-US") {
  const amount = Number(value || 0);

  try {
    // Decimal digits khud fix kiye hain — warna Node ("PKR 75.00") aur
    // Chrome ("PKR 75") alag likhte hain aur hydration error aata hai.
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Currency code ghalat ho to site crash na ho
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Charts ke liye — bina decimal, chhota text
export function formatPriceShort(value, currency = "USD", locale = "en-US") {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}