"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/useCart";
import { useCurrency } from "@/lib/useCurrency";
import { formatPrice } from "@/lib/format";

export default function CheckoutPage() {
  const { items, count, total, clearCart } = useCart();
  const currency = useCurrency();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const shipping = 0;
  const grandTotal = total + shipping;

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Order could not be placed."
        );
      }

      setOrder(data);
      await clearCart().catch(() => {});
    } catch (err) {
      setError(
        err.message || "Order could not be placed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Success ----------
  if (order) {
    return (
      <div className="min-h-screen bg-[#fdfcf9]">
      <section className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8b8679]">
          Order confirmed
        </p>

        <h1 className="mt-3 font-playfair text-4xl text-[#1f2119]">
          Thank you!
        </h1>

        <p className="mt-4 text-sm text-[#6b675e]">
          Your order{" "}
          <span className="font-medium text-[#1f2119]">
            {order.orderNumber}
          </span>{" "}
          has been placed.
        </p>

        <p className="mt-2 text-sm text-[#6b675e]">
          We will contact you at {order.customer?.email || form.email}.
        </p>

        {order.hasPreorder ? (
          <p className="mt-3 text-xs text-[#8b8679]">
            This order contains a preorder item.
          </p>
        ) : null}

        {order.hasBackorder ? (
          <p className="mt-1 text-xs text-[#8b8679]">
            This order contains a backorder item.
          </p>
        ) : null}

        <Link
          href="/#products"
          className="mt-8 inline-block rounded-sm bg-[#1f2119] px-6 py-3 text-xs uppercase tracking-[0.16em] text-white"
        >
          Continue shopping
        </Link>
      </section>
      </div>
    );
  }

  // ---------- Empty ----------
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fdfcf9]">
      <section className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="font-playfair text-3xl text-[#1f2119]">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-[#8b8679]">
          Add a product before going to checkout.
        </p>
        <Link
          href="/#products"
          className="mt-6 inline-block rounded-sm bg-[#1f2119] px-6 py-3 text-xs uppercase tracking-[0.16em] text-white"
        >
          Continue shopping
        </Link>
      </section>
      </div>
    );
  }

  const invalidItem = items.find((item) => item.canAddToCart === false);

  return (
    <div className="min-h-screen bg-[#fdfcf9]">
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="border-b border-[#e7e3da] pb-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8b8679]">
          Checkout
        </p>
        <h1 className="mt-2 font-playfair text-4xl text-[#1f2119]">
          Complete your order
        </h1>
        <p className="mt-1 text-sm text-[#8b8679]">
          {count} item{count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h2 className="font-playfair text-2xl text-[#1f2119]">
            Contact & delivery
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name *"
              name="name"
              value={form.name}
              onChange={change}
              placeholder="Your name"
            />

            <Field
              label="Email *"
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              placeholder="you@example.com"
            />

            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={change}
              placeholder="+92 300 0000000"
            />

            <Field
              label="City"
              name="city"
              value={form.city}
              onChange={change}
              placeholder="Lahore"
            />

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#6b675e]">
                Delivery address *
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={change}
                rows={3}
                placeholder="House, street, area..."
                className="w-full rounded-sm border border-[#d8d3c7] bg-white px-3 py-2 text-sm text-[#1f2119] outline-none transition focus:border-[#1f2119]"
              />
            </div>
          </div>

          <h2 className="mt-8 font-playfair text-2xl text-[#1f2119]">
            Payment
          </h2>

          <div className="mt-3 rounded-sm border border-[#d8d3c7] bg-white px-4 py-3 text-sm text-[#1f2119]">
            Cash on Delivery
          </div>

          {invalidItem ? (
            <p className="mt-4 rounded-sm bg-[#fdf2f0] px-3 py-2 text-xs text-[#b3453b]">
              Please remove unavailable items from your cart before placing
              the order.
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-sm bg-[#fdf2f0] px-3 py-2 text-xs text-[#b3453b]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || Boolean(invalidItem)}
            className="mt-6 w-full rounded-sm bg-[#1f2119] px-6 py-3 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#3a3d31] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </form>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-[#e7e3da] bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-playfair text-2xl text-[#1f2119]">
            Order summary
          </h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-[#f4f1ea]">
                  <img
                    src={item.image || "/images/products/tshirt.jpg"}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#1f2119]">{item.title}</p>
                  <p className="mt-1 text-xs text-[#8b8679]">
                    Qty {item.quantity} × {formatPrice(item.price, currency)}
                  </p>

                  {item.canAddToCart === false ? (
                    <p className="mt-1 text-[11px] text-[#b3453b]">
                      {item.message}
                    </p>
                  ) : null}
                </div>

                <p className="text-sm text-[#1f2119]">
                  {formatPrice(item.price * item.quantity, currency)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 border-t border-[#e7e3da] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#6b675e]">Subtotal</dt>
              <dd className="text-[#1f2119]">
                {formatPrice(total, currency)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#6b675e]">Shipping</dt>
              <dd className="text-[#1f2119]">
                {shipping === 0 ? "Free" : formatPrice(shipping, currency)}
              </dd>
            </div>

            <div className="flex items-center justify-between border-t border-[#e7e3da] pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPrice(grandTotal, currency)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#6b675e]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-sm border border-[#d8d3c7] bg-white px-3 py-2 text-sm text-[#1f2119] outline-none transition focus:border-[#1f2119]"
      />
    </div>
  );
}