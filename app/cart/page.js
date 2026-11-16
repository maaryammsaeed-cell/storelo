"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/useCart";
import { useCurrency } from "@/lib/useCurrency";
import { formatPrice } from "@/lib/format";

// NOTE: Shipping abhi fixed hai.
// Baad me isay Settings se laana chahiye (hardcode nahi rehna chahiye).
const SHIPPING = 0;

export default function CartPage() {
  const router = useRouter();
  const { items, count, changeQuantity, removeFromCart, clearCart } =
    useCart();
  const currency = useCurrency();

  const [error, setError] = useState("");
  // Jin items ko customer ne UNCHECK kiya (baaqi sab selected)
  const [excludedIds, setExcludedIds] = useState([]);

  const selectedItems = items.filter((item) => !excludedIds.includes(item.id));

  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const selectedTotal = selectedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const selectedGrandTotal =
    selectedTotal + (selectedItems.length > 0 ? SHIPPING : 0);

  const allSelected =
    items.length > 0 && items.every((item) => !excludedIds.includes(item.id));

  function toggleItem(id) {
    setExcludedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function toggleAll() {
    setExcludedIds(allSelected ? items.map((item) => item.id) : []);
  }

  // Sirf selected items check karo — unchk kiya hua invalid item checkout rok na de
  const hasInvalidItem = selectedItems.some(
    (item) => item.canAddToCart === false
  );

  // Quantity badalne ka safe wrapper — API error pakarta hai
  async function handleQuantity(id, delta) {
    setError("");
    try {
      await changeQuantity(id, delta);
    } catch (err) {
      setError(err?.message || "Unable to update quantity.");
    }
  }

  // Item remove karne ka safe wrapper
  async function handleRemove(id) {
    setError("");
    setExcludedIds((current) => current.filter((value) => value !== id));
    try {
      await removeFromCart(id);
    } catch (err) {
      setError(err?.message || "Unable to remove item.");
    }
  }

  function handleClear() {
    if (window.confirm("Clear your cart?")) {
      setExcludedIds([]);
      clearCart();
    }
  }

  function checkoutItem(item) {
    // Buy-now alag flow hai — selected list clear karo
    sessionStorage.removeItem("checkoutItems");

    sessionStorage.setItem(
      "buyNowItem",
      JSON.stringify({
        productId: item.id,
        quantity: item.quantity,
      })
    );
    router.push("/checkout");
  }

  return (
    <section className="bg-[#fdfcf9] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e7e3da] pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#8b8679]">
              Shopping bag
            </p>
            <h1 className="mt-2 font-playfair text-4xl text-[#1f2119]">
              My Cart
            </h1>
          </div>
          <p className="text-sm text-[#8b8679]">
            {selectedCount} of {count} item{count === 1 ? "" : "s"} selected
          </p>
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-playfair text-2xl text-[#1f2119]">
              Your cart is empty
            </p>
            <p className="mt-2 text-sm text-[#8b8679]">
              Looks like you haven&apos;t added anything yet.
            </p>
            <Link
              href="/#products"
              className="mt-6 inline-block rounded-sm bg-[#1f2119] px-6 py-3 text-xs uppercase tracking-[0.16em] text-white"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              {/* ================= DESKTOP: TABLE ================= */}
              <div className="hidden overflow-x-auto rounded-xl border border-[#e7e3da] bg-white md:block">
                <table className="w-full text-left">
                  <thead className="bg-[#faf8f3] text-[11px] uppercase tracking-[0.14em] text-[#8b8679]">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <ItemCheckbox
                          checked={allSelected}
                          onChange={toggleAll}
                          label="Select all items"
                        />
                      </th>
                      <th className="px-4 py-3">Product</th>
    
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Checkout</th>
                      <th className="px-4 py-3 text-right">Remove</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-[#e7e3da]">
                        <td className="px-4 py-4">
                          <ItemCheckbox
                            checked={!excludedIds.includes(item.id)}
                            onChange={() => toggleItem(item.id)}
                            label={`Select ${item.title}`}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-[#f4f1ea]">
                              <Image
                                src={item.image || "/images/products/tshirt.jpg"}
                                alt={item.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>

                            <div>
                              <p className="text-sm text-[#1f2119]">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs text-[#8b8679]">
                                {formatPrice(item.price, currency)}
                              </p>

                              {/* Stock warning / low stock message */}
                              {item.state && item.state !== "available" ? (
                                <p
                                  className={`mt-1 text-xs ${
                                    item.canAddToCart
                                      ? "text-[#b7791f]"
                                      : "text-[#b3453b]"
                                  }`}
                                >
                                  {item.message}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                    

                        <td className="px-4 py-4">
                          <QuantityStepper
                            item={item}
                            changeQuantity={handleQuantity}
                          />
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-[#1f2119]">
                          {formatPrice(item.price * item.quantity, currency)}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => checkoutItem(item)}
                            disabled={item.canAddToCart === false}
                            className="rounded-sm border border-[#1f2119] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#1f2119] transition hover:bg-[#1f2119] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Checkout
                          </button>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            aria-label={`Remove ${item.title}`}
                            className="text-[#8b8679] transition hover:text-[#b3453b]"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ================= MOBILE: SELECT ALL ================= */}
              <div className="mb-3 flex items-center justify-between rounded-xl border border-[#e7e3da] bg-white px-4 py-3 md:hidden">
                <label className="flex items-center gap-2 text-xs text-[#1f2119]">
                  <ItemCheckbox
                    checked={allSelected}
                    onChange={toggleAll}
                    label="Select all items"
                  />
                  Select all
                </label>
                <span className="text-[11px] text-[#8b8679]">
                  {selectedCount} of {count} selected
                </span>
              </div>

              {/* ================= MOBILE: CARDS ================= */}
              <ul className="space-y-3 md:hidden">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[#e7e3da] bg-white p-4"
                  >
                    <div className="flex gap-3">
                      <div className="pt-1">
                        <ItemCheckbox
                          checked={!excludedIds.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          label={`Select ${item.title}`}
                        />
                      </div>

                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-[#f4f1ea]">
                        <Image
                          src={item.image || "/images/products/tshirt.jpg"}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-[#1f2119]">
                            {item.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            aria-label={`Remove ${item.title}`}
                            className="text-[#8b8679] transition hover:text-[#b3453b]"
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-[#8b8679]">
                          {formatPrice(item.price, currency)}
                        </p>

                        {/* Stock warning / low stock message */}
                        {item.state && item.state !== "available" ? (
                          <p
                            className={`mt-1 text-xs ${
                              item.canAddToCart
                                ? "text-[#b7791f]"
                                : "text-[#b3453b]"
                            }`}
                          >
                            {item.message}
                          </p>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <QuantityStepper
                            item={item}
                            changeQuantity={handleQuantity}
                          />
                          <button
                            type="button"
                            onClick={() => checkoutItem(item)}
                            disabled={item.canAddToCart === false}
                            className="mt-3 w-full rounded-sm border border-[#1f2119] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[#1f2119] transition hover:bg-[#1f2119] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Checkout this item
                          </button>
                          <p className="text-sm font-medium text-[#1f2119]">
                            {formatPrice(item.price * item.quantity, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Continue shopping */}
              <Link
                href="/#products"
                className="mt-6 inline-flex items-center gap-2 rounded-sm border border-[#1f2119] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#1f2119] transition hover:bg-[#1f2119] hover:text-white"
              >
                <ArrowLeftIcon />
                Continue Shopping
              </Link>
            </div>

            {/* ================= CART SUMMARY ================= */}
            <aside className="h-fit rounded-xl border border-[#e7e3da] bg-white p-5 lg:sticky lg:top-24">
              <h2 className="font-playfair text-2xl text-[#1f2119]">
                Cart Summary
              </h2>
              <p className="mt-1 text-[11px] text-[#8b8679]">
                Sirf tick kiye hue items checkout honge.
              </p>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#6b675e]">
                    Subtotal ({selectedCount} items)
                  </dt>
                  <dd className="text-[#1f2119]">
                    {formatPrice(selectedTotal, currency)}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="text-[#6b675e]">Shipping</dt>
                  <dd className="text-[#1f2119]">
                    {selectedItems.length === 0
                      ? "—"
                      : SHIPPING === 0
                        ? "Free"
                        : formatPrice(SHIPPING, currency)}
                  </dd>
                </div>

                <div className="flex items-center justify-between border-t border-[#e7e3da] pt-3 text-base font-medium text-[#1f2119]">
                  <dt>Total</dt>
                  <dd>{formatPrice(selectedGrandTotal, currency)}</dd>
                </div>
              </dl>

              {/* API error (stock limit, etc.) */}
              {error ? (
                <p className="mt-4 rounded-sm bg-[#fdf2f0] px-3 py-2 text-xs text-[#b3453b]">
                  {error}
                </p>
              ) : null}

              {/* Agar koi selected item invalid hai to checkout se pehle batao */}
              {hasInvalidItem ? (
                <p className="mt-4 rounded-sm bg-[#fdf2f0] px-3 py-2 text-xs text-[#b3453b]">
                  Some selected items are no longer available. Please remove
                  them from your cart before checkout.
                </p>
              ) : null}

              {/* Kuch bhi select nahi */}
              {selectedItems.length === 0 ? (
                <p className="mt-4 rounded-sm bg-[#fdf2f0] px-3 py-2 text-xs text-[#b3453b]">
                  Checkout ke liye kam az kam ek item select karein.
                </p>
              ) : null}

              <button
                type="button"
                disabled={hasInvalidItem || selectedItems.length === 0}
                onClick={() => {
                  if (selectedItems.length === 0) return;

                  sessionStorage.setItem(
                    "checkoutItems",
                    JSON.stringify(selectedItems.map((item) => item.id))
                  );
                  // Purana buy-now item hatao, warna checkout sirf usi item ka
                  // summary dikhata reh jata hai.
                  sessionStorage.removeItem("buyNowItem");
                  router.push("/checkout");
                }}
                className="mt-6 w-full rounded-sm bg-[#1f2119] px-5 py-3 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#3a3d31] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proceed to Checkout
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="mt-3 w-full rounded-sm border border-[#1f2119] px-5 py-3 text-xs uppercase tracking-[0.16em] text-[#1f2119] transition hover:bg-[#f4f1ea]"
              >
                Clear Cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Quantity stepper — stock limit par "+" disable
// =====================================================
function QuantityStepper({ item, changeQuantity }) {
  // "+" kab disable ho?
  // 1. Item add ho hi na sakta ho
  // 2. Ya quantity stock tak pohanch gayi ho
  const maxReached =
    !item.canAddToCart ||
    (!item.isPreorder &&
      !item.isBackorder &&
      Number(item.quantity) >= Number(item.stock));

  return (
    <div className="inline-flex items-center border border-[#e7e3da]">
      <button
        type="button"
        onClick={() => changeQuantity(item.id, -1)}
        aria-label="Decrease quantity"
        className="px-3 py-1.5 text-sm text-[#1f2119] transition hover:bg-[#f4f1ea]"
      >
        −
      </button>

      <span className="min-w-8 px-2 text-center text-sm font-medium text-[#1f2119]">
        {item.quantity}
      </span>

      <button
        type="button"
        disabled={maxReached}
        onClick={() => changeQuantity(item.id, 1)}
        aria-label="Increase quantity"
        className="px-3 py-1.5 text-sm text-[#1f2119] transition hover:bg-[#f4f1ea] disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function ItemCheckbox({ checked, onChange, label }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 shrink-0 cursor-pointer accent-[#b37b95]"
    />
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}