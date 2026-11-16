"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/useCart";
import { formatPrice } from "@/lib/format";
import { getStockState } from "@/lib/product";

export default function ProductDetails({
  product,
  currency,
  lowStockLimit,   // [1] Settings se aata hai (e.g. 3)
  allowBackorder,  // [1] Store-level permission (true/false)
}) {
  const router = useRouter();
  const { addToCart } = useCart();

  // [2] Saara stock faisla EK hi function se hota hai
  const stockState = getStockState(product, {
    lowStockLimit,
    allowBackorder,
  });

  // [3] Neeche UI inhi values par chalega
  const { canAddToCart, label, message, isPreorder, isBackorder, stock } =
    stockState;

  // [4] Quantity ki max hadd
  //     preorder/backorder → 99 tak
  //     normal stock → stock jitna (kam az kam 1)
  const maxQuantity =
    isPreorder || isBackorder ? 99 : Math.max(1, Number(stock) || 1);

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const [size, setSize] = useState(sizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  async function add(goToCart) {
    // [5] Cart me bhejne se PEHLE yahin rok do
    if (!canAddToCart) {
      setError(message);
      return;
    }

    setBusy(true);
    setError("");

    try {
      await addToCart(product, quantity);
      setAdded(true);
      if (goToCart) router.push("/cart");
    } catch (err) {
      // [6] API ka asli message dikhao (STOCK_LIMIT / OUT_OF_STOCK etc.)
      setError(
        err?.message || "Unable to add to cart. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
      {/* Wapas products par */}
      <Link
        href="/#products"
        className="text-[11px] uppercase tracking-[0.16em] text-[#8b8679] transition hover:text-[#1f2119]"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* ------- IMAGE ------- */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#f4f1ea]">
          {product.oldPrice ? (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-[#1f2119] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
              Sale
            </span>
          ) : null}

          <Image
            src={product.image || "/images/products/tshirt.jpg"}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        {/* ------- DETAILS ------- */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#8b8679]">
            {product.category}
          </p>

          <h1 className="mt-2 font-playfair text-4xl leading-tight text-[#1f2119] sm:text-5xl">
            {product.title}
          </h1>

          {/* Price */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xl text-[#1f2119]">
              {formatPrice(product.price, currency)}
            </span>
            {product.oldPrice ? (
              <span className="text-sm text-[#9a958a] line-through">
                {formatPrice(product.oldPrice, currency)}
              </span>
            ) : null}
          </div>

          {/* [7] Stock ka label: IN STOCK / LOW STOCK / OUT OF STOCK ... */}
          <p
            className={`mt-2 text-[11px] uppercase tracking-[0.16em] ${canAddToCart ? "text-[#2f6b3f]" : "text-[#b3453b]"
              }`}
          >
            {label}
          </p>

          {/* [8] Tafseeli message: "Only 2 items left" etc. */}
          <p
            className={`mt-1 text-xs ${canAddToCart ? "text-[#6b675e]" : "text-[#b3453b]"
              }`}
          >
            {message}
          </p>

          {/* Size */}
          {sizes.length > 0 ? (
            <div className="mt-8">
              <p className="text-sm text-[#1f2119]">Size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={`min-w-24 rounded-sm border px-4 py-2 text-sm transition ${size === option
                        ? "border-[#1f2119] bg-[#1f2119] text-white"
                        : "border-[#d8d3c7] text-[#1f2119] hover:border-[#1f2119]"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Quantity + Add to cart */}
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="inline-flex items-center border border-[#d8d3c7]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="px-4 py-3 text-[#1f2119] hover:bg-[#f4f1ea]"
              >
                −
              </button>
              <span className="min-w-10 text-center text-sm text-[#1f2119]">
                {quantity}
              </span>
              <button
                type="button"
                // [9] "+" par maxQuantity se zyada na jaye
                onClick={() =>
                  setQuantity((q) => Math.min(maxQuantity, q + 1))
                }
                aria-label="Increase quantity"
                className="px-4 py-3 text-[#1f2119] hover:bg-[#f4f1ea]"
              >
                +
              </button>
            </div>

            <button
              type="button"
              // [10] Stock/status allow na kare to button disable
              disabled={busy || !canAddToCart}
              onClick={() => add(false)}
              className="flex-1 rounded-sm bg-[#1f2119] px-6 py-3 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#3a3d31] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* [11] State ke hisaab se button ka text */}
              {isPreorder
                ? "Pre-order"
                : isBackorder
                  ? "Add to Cart (Backorder)"
                  : added
                    ? "Added ✓"
                    : "Add to cart"}
            </button>
          </div>

          {/* Buy it now */}
          <button
            type="button"
            // [12] Wahi disable rule
            disabled={busy || !canAddToCart}
            onClick={() => add(true)}
            className="mt-3 w-full rounded-sm border border-[#1f2119] bg-white px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#1f2119] transition hover:bg-[#f4f1ea] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* [13] Buy it now ka text bhi state ke hisaab se */}
            {isPreorder
              ? "Pre-order now"
              : isBackorder
                ? "Buy it now (Backorder)"
                : "Buy it now"}
          </button>

          {error ? (
            <p className="mt-3 text-xs text-[#b3453b]">{error}</p>
          ) : null}

          {/* Description */}
          {product.description ? (
            <div className="mt-10 border-t border-[#e7e3da] pt-6">
              <h2 className="text-sm font-medium text-[#1f2119]">
                Product Description
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#6b675e]">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}