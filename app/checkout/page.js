"use client";

import Link from "next/link";
import { useCart } from "@/lib/useCart";
import { useCurrency } from "@/lib/useCurrency";
import { formatPrice } from "@/lib/format";
import { useEffect, useRef, useState } from "react";

export default function CheckoutPage() {
  const { items, clearCart, removeFromCart } = useCart();
  const currency = useCurrency();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
  });

  const [payment, setPayment] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const checkoutKeyRef = useRef(null);
  const submittingRef = useRef(false);
  const reserveOnceRef = useRef(false);

  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [buyNowItem] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(sessionStorage.getItem("buyNowItem") || "null");
    } catch {
      return null;
    }
  });
  const buyNow = Boolean(buyNowItem?.productId);

  // Cart page se tick kiye hue items ki ids
  const [selectedProductIds] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(sessionStorage.getItem("checkoutItems") || "null");
    } catch {
      return null;
    }
  });

  const hasSelection =
    Array.isArray(selectedProductIds) && selectedProductIds.length > 0;

  const [reserving, setReserving] = useState(!buyNow);
  const [reserveError, setReserveError] = useState("");

  const shipping = 0;

  const lineItems = buyNow
    ? items.filter((item) => item.id === buyNowItem.productId)
    : hasSelection
      ? items.filter((item) => selectedProductIds.includes(item.id))
      : items;

  const checkoutCount = lineItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const checkoutTotal = lineItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const grandTotal = checkoutTotal + shipping;
  const expired = secondsLeft === 0;

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

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!form.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!form.state.trim()) {
      setError("Please enter your state or province.");
      return;
    }

    if (lineItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (expired) {
      setError(
        "Stock reservation expired. Please refresh the page and try again."
      );
      return;
    }

    // Double-submit guard (validation ke baad, taake error par stuck na ho)
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Idempotency key render ke waqt nahi, submit par generate karo
    if (!checkoutKeyRef.current) {
      checkoutKeyRef.current = crypto.randomUUID();
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutKey: checkoutKeyRef.current,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: [form.address.trim(), form.apartment.trim()]
            .filter(Boolean)
            .join(", "),
          city: form.city.trim(),
          state: form.state.trim(),
          paymentMethod: payment,
          buyNowItem: buyNow ? buyNowItem : null,
          selectedProductIds: hasSelection ? selectedProductIds : null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Order could not be placed."
        );
      }

      setOrder(data);

      if (buyNow) {
        await removeFromCart(buyNowItem.productId).catch(() => {});
        sessionStorage.removeItem("buyNowItem");
      } else if (hasSelection) {
        // Ek ek kar ke hatao — parallel DELETE se JSON file conflict ho sakta hai
        for (const id of selectedProductIds) {
          await removeFromCart(id).catch(() => {});
        }
        sessionStorage.removeItem("checkoutItems");
      } else {
        await clearCart().catch(() => {});
      }
    } catch (err) {
      setError(
        err.message || "Order could not be placed. Please try again."
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  // Checkout khulte hi stock 5 minute ke liye hold karo
  useEffect(() => {
    // Buy-now me reservation nahi lagti
    if (buyNow) return;

    if (reserveOnceRef.current) return;
    if (lineItems.length === 0) return;

    reserveOnceRef.current = true;

    fetch("/api/checkout/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedProductIds: hasSelection ? selectedProductIds : null,
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Unable to reserve stock."
          );
        }

        setExpiresAt(data.expiresAt);
      })
      .catch((err) => {
        setReserveError(err.message || "Unable to reserve stock.");
      })
      .finally(() => {
        setReserving(false);
      });
  }, [lineItems.length, buyNow, hasSelection, selectedProductIds]);

  // 5 minute ka countdown
  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      setSecondsLeft(
        Math.max(
          0,
          Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
        )
      );
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // ---------- Success ----------
  if (order) {
    return (
      <div className="pb-16">
        <section className="mx-auto max-w-2xl px-5 pt-10 sm:px-8">
          <div className="rounded-2xl border border-[#e7e3da] bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(31,33,25,0.04)]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6ef] text-[#2f6b3f]">
              <CheckIcon className="h-7 w-7" />
            </span>

            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[#8b8679]">
              Order confirmed
            </p>

            <h1 className="mt-2 font-playfair text-4xl text-[#1f2119]">
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
              className="mt-8 inline-block rounded-md bg-[#3c3e2d] px-7 py-3 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#2f3126]"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // ---------- Empty ----------
  if (lineItems.length === 0) {
    return (
      <div className="pb-16">
        <section className="mx-auto max-w-2xl px-5 pt-10 sm:px-8">
          <div className="rounded-2xl border border-[#e7e3da] bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(31,33,25,0.04)]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f1e7] text-[#3c3e2d]">
              <BagIcon className="h-7 w-7" />
            </span>

            <h1 className="mt-6 font-playfair text-3xl text-[#1f2119]">
              Your cart is empty
            </h1>
            <p className="mt-2 text-sm text-[#8b8679]">
              Add a product before going to checkout.
            </p>
            <Link
              href="/#products"
              className="mt-6 inline-block rounded-md bg-[#3c3e2d] px-7 py-3 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#2f3126]"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const invalidItem = lineItems.find((item) => item.canAddToCart === false);

  return (
    <div className="pb-16">
      <section className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#a39d8f]"
        >
          <Link href="/" className="transition hover:text-[#1f2119]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/cart" className="transition hover:text-[#1f2119]">
            Cart
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#1f2119]">Checkout</span>
        </nav>

        {/* Heading */}
        <div className="mt-7 text-center">
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#8b8679]">
            <LockIcon className="h-3.5 w-3.5" />
            Secure Checkout
          </p>
          <h1 className="mt-3 font-playfair text-4xl leading-tight text-[#1f2119] sm:text-5xl">
            Complete your order
          </h1>
          <p className="mt-2 text-sm text-[#8b8679]">
            Almost there! Please fill in your details and place your order.
          </p>
        </div>

        {/* Reservation status */}
        <div className="mt-5 flex flex-col items-center gap-2">
          {secondsLeft !== null ? (
            <p
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] ${
                expired
                  ? "bg-[#fdf2f0] text-[#b3453b]"
                  : "bg-[#eef6ef] text-[#2f6b3f]"
              }`}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              {expired
                ? "Stock reservation expired. Please refresh the page and try again."
                : `Stock reserved for ${Math.floor(
                    secondsLeft / 60
                  )}:${String(secondsLeft % 60).padStart(2, "0")}`}
            </p>
          ) : null}

          {reserving && !expiresAt && !reserveError ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f4f1ea] px-3.5 py-1.5 text-[11px] text-[#6b675e]">
              <ClockIcon className="h-3.5 w-3.5" />
              Reserving your items for 5 minutes...
            </p>
          ) : null}

          {reserveError ? (
            <p className="rounded-full bg-[#fdf2f0] px-3.5 py-1.5 text-[11px] text-[#b3453b]">
              {reserveError}
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_368px] lg:items-start">
          {/* ================= Form ================= */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#e7e3da] bg-white p-5 shadow-[0_1px_2px_rgba(31,33,25,0.04)] sm:p-7"
          >
            {/* 1. Contact */}
            <SectionHeader
              number="1"
              title="Contact Information"
              text="We will use this email to send you order updates."
              icon={<UserIcon />}
            />

            <div className="mt-4">
              <Field
                label="Email Address *"
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                placeholder="you@example.com"
              />
            </div>

            <Divider />

            {/* 2. Shipping */}
            <SectionHeader
              number="2"
              title="Shipping Information"
              text="Enter the address where you want your order to be delivered."
              icon={<TruckIcon />}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full Name *"
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Your name"
              />

              <Field
                label="Phone Number *"
                name="phone"
                value={form.phone}
                onChange={change}
                placeholder="+92 300 0000000"
              />

              <div className="sm:col-span-2">
                <Field
                  label="Street Address *"
                  name="address"
                  value={form.address}
                  onChange={change}
                  placeholder="House, street, area..."
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Apartment, suite, etc. (optional)"
                  name="apartment"
                  value={form.apartment}
                  onChange={change}
                  placeholder="Near Park"
                />
              </div>

              <Field
                label="City *"
                name="city"
                value={form.city}
                onChange={change}
                placeholder="Lahore"
              />

              <Field
                label="State / Province *"
                name="state"
                value={form.state}
                onChange={change}
                placeholder="Punjab"
              />
            </div>

            <Divider />

            {/* 3. Payment */}
            <SectionHeader
              number="3"
              title="Payment Method"
              text="Choose a payment method that works for you."
              icon={<CardIcon />}
            />

            <div className="mt-4 space-y-2.5">
              <PaymentOption
                value="cod"
                checked={payment === "cod"}
                onChange={() => setPayment("cod")}
                title="Cash on Delivery"
                text="Pay when you receive your order"
                icon={<CashIcon />}
              />

              <PaymentOption
                title="Credit / Debit Card"
                text="Secure payments via Visa, Mastercard etc."
                badge={<CardLogos />}
                value="card"
                checked={payment === "card"}
                onChange={() => setPayment("card")}
              />

              <PaymentOption
                title="Easypaisa"
                text="Pay using your Easypaisa account."
                badge={<EasypaisaLogo />}
                value="easypaisa"
                checked={payment === "easypaisa"}
                onChange={() => setPayment("easypaisa")}
              />

              <PaymentOption
                title="JazzCash"
                text="Pay using your JazzCash account."
                badge={<JazzCashLogo />}
                value="jazzcash"
                checked={payment === "jazzcash"}
                onChange={() => setPayment("jazzcash")}
              />
            </div>

            <p className="mt-3 text-[11px] text-[#a39d8f]">
              Online payments are coming soon. Cash on delivery is available
              right now.
            </p>

            {invalidItem ? (
              <p className="mt-4 rounded-md bg-[#fdf2f0] px-3.5 py-2.5 text-xs text-[#b3453b]">
                Please remove unavailable items from your cart before placing
                the order.
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-md bg-[#fdf2f0] px-3.5 py-2.5 text-xs text-[#b3453b]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                submitting ||
                Boolean(invalidItem) ||
                reserving ||
                Boolean(reserveError) ||
                expired
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#2f4a34] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#263d2a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockIcon className="h-3.5 w-3.5" />
              {submitting
                ? "Placing order..."
                : reserving
                  ? "Reserving stock..."
                  : "Place Order"}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b8679]">
              <ShieldIcon className="h-3.5 w-3.5" />
              Your personal data is secure with us.
            </p>
          </form>

          {/* ================= Summary ================= */}
          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[#e7e3da] bg-white p-5 shadow-[0_1px_2px_rgba(31,33,25,0.04)]">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-playfair text-xl text-[#1f2119]">
                  Order Summary{" "}
                  <span className="font-sans text-xs text-[#8b8679]">
                    ({checkoutCount} item{checkoutCount === 1 ? "" : "s"})
                  </span>
                </h2>
                <Link
                  href="/cart"
                  className="flex items-center gap-1 text-[11px] font-medium text-[#3c3e2d] transition hover:text-[#1f2119]"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit Cart
                </Link>
              </div>

              <ul className="mt-4 space-y-4">
                {lineItems.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-[#f4f1ea]">
                      <img
                        src={item.image || "/images/products/tshirt.jpg"}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-[#1f2119]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#8b8679]">
                        Qty: {item.quantity}
                        {item.isPreorder
                          ? " · Preorder"
                          : item.isBackorder
                            ? " · Backorder"
                            : ""}
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
                    {formatPrice(checkoutTotal, currency)}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="text-[#6b675e]">Shipping</dt>
                  <dd className="text-[#1f2119]">
                    {shipping === 0
                      ? "Free"
                      : formatPrice(shipping, currency)}
                  </dd>
                </div>

                <div className="flex items-center justify-between border-t border-[#e7e3da] pt-3">
                  <dt className="text-base font-semibold text-[#1f2119]">
                    Total
                  </dt>
                  <dd className="font-playfair text-2xl text-[#1f2119]">
                    {formatPrice(grandTotal, currency)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Why shop with us */}
            <div className="rounded-2xl border border-[#dde5d6] bg-[#f6f8f3] p-5">
              <h2 className="text-sm font-semibold text-[#1f2119]">
                Why shop with us?
              </h2>

              <ul className="mt-3 space-y-2.5">
                {[
                  "100% Secure Payments",
                  "7 Days Easy Returns",
                  "Cash on Delivery Available",
                  "24/7 Customer Support",
                ].map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-xs text-[#55544a]"
                  >
                    <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-[#8b9c7e]" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Privacy */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#e7e3da] bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9d6bf] text-[#3c3e2d]">
                <LockIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#1f2119]">
                  We protect your privacy
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-[#8b8679]">
                  Your information is safe with us. We never share your
                  details.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Trust bar */}
        <ul className="mt-8 grid gap-px overflow-hidden rounded-xl border border-[#e7e3da] bg-[#e7e3da] sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <TruckIcon />,
              title: "Free Shipping",
              text: "Free delivery on every order",
            },
            {
              icon: <CashIcon />,
              title: "Cash on Delivery",
              text: "Pay when you receive",
            },
            {
              icon: <ReturnIcon />,
              title: "Easy Returns",
              text: "7 days return policy",
            },
            {
              icon: <HeadsetIcon />,
              title: "Customer Support",
              text: "24/7 we are here to help",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="flex items-center gap-3 bg-white px-5 py-4"
            >
              <span className="text-[#3c3e2d]">{item.icon}</span>
              <div>
                <p className="text-xs font-medium text-[#1f2119]">
                  {item.title}
                </p>
                <p className="text-[11px] text-[#8b8679]">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------------- Small UI pieces ---------------- */

function SectionHeader({ number, title, text, icon }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f1e7] text-[#3c3e2d]">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-[#1f2119]">
          {number}. {title}
        </h2>
        <p className="mt-0.5 text-xs text-[#8b8679]">{text}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-6 h-px bg-[#efece4]" />;
}

function Field({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label
        htmlFor={`checkout-${name}`}
        className="mb-1.5 block text-xs font-medium text-[#55544a]"
      >
        {label}
      </label>
      <input
        id={`checkout-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#ddd7ca] bg-white px-3.5 py-2.5 text-sm text-[#1f2119] outline-none transition placeholder:text-[#b3ad9f] focus:border-[#3c3e2d] focus:ring-2 focus:ring-[#3c3e2d]/10"
      />
    </div>
  );
}

function PaymentOption({
  value,
  checked = false,
  onChange,
  title,
  text,
  icon,
  badge,
  disabled = false,
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 transition ${
        disabled
          ? "cursor-not-allowed border-[#e7e3da] bg-[#fbfaf6] opacity-70"
          : checked
            ? "cursor-pointer border-[#3c3e2d] bg-[#f6f8f3]"
            : "cursor-pointer border-[#e7e3da] bg-white hover:border-[#c9c2b2]"
      }`}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 shrink-0 accent-[#3c3e2d]"
      />

      {icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f1e7] text-[#3c3e2d]">
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#1f2119]">{title}</span>
          {disabled ? (
            <span className="rounded-full bg-[#f4f1ea] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#8b8679]">
              Soon
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[11px] text-[#8b8679]">
          {text}
        </span>
      </span>

      {badge ? <span className="shrink-0">{badge}</span> : null}
    </label>
  );
}

/* ---------------- Payment marks ---------------- */

function CardLogos() {
  return (
    <span className="flex items-center gap-1">
      <span className="rounded-sm bg-[#1a1f71] px-1.5 py-0.5 text-[9px] font-bold italic tracking-wider text-white">
        VISA
      </span>
      <span className="flex items-center" aria-hidden="true">
        <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] opacity-90" />
      </span>
    </span>
  );
}

function EasypaisaLogo() {
  return (
    <span className="text-[10px] font-semibold text-[#00a651]">
      easypaisa
    </span>
  );
}

function JazzCashLogo() {
  return (
    <span className="text-[10px] font-semibold text-[#d31c2e]">
      JazzCash
    </span>
  );
}

/* ---------------- Icons ---------------- */

function Svg({ children, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </Svg>
  );
}

function TruckIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="6.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </Svg>
  );
}

function CardIcon({ className }) {
  return (
    <Svg className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </Svg>
  );
}

function CashIcon({ className }) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5h.01M18 14.5h.01" />
    </Svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  );
}

function LockIcon({ className }) {
  return (
    <Svg className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </Svg>
  );
}

function ReturnIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 9h9a4 4 0 010 8H8" />
      <path d="M7 6L4 9l3 3" />
    </Svg>
  );
}

function HeadsetIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
    </Svg>
  );
}

function CheckIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M5 12l4 4 10-10" />
    </Svg>
  );
}

function BagIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M6 8h12l1 12H5z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </Svg>
  );
}

function ClockIcon({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </Svg>
  );
}

function PencilIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 20h4l10-10-4-4L4 16z" />
      <path d="M14 6l4 4" />
    </Svg>
  );
}