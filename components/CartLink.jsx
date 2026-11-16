"use client";

import Link from "next/link";
import { useCart } from "@/lib/useCart";

export default function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} items`}
      className="relative grid h-9 w-9 place-items-center rounded-full border border-[#f4f1e7]/40 text-[#f4f1e7] transition hover:border-[#e6d3a3] hover:text-[#e6d3a3]"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.2" />
        <circle cx="18" cy="20" r="1.2" />
      </svg>

      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e6d3a3] px-1 text-[10px] font-semibold text-[#3c3e2d]">
          {count}
        </span>
      ) : null}
    </Link>
  );
}