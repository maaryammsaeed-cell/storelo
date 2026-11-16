"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { getStockState } from "@/lib/product";

const BADGE_CLASS = {
  available: "bg-[#2f6b3f]",
  low_stock: "bg-[#b7791f]",
  out_of_stock: "bg-[#b3453b]",
  discontinued: "bg-[#4b4b4b]",
  temporarily_unavailable: "bg-[#6b675e]",
  unavailable: "bg-[#6b675e]",
  preorder: "bg-[#1f2119]",
  backorder: "bg-[#b7791f]",
};

export default function ProductCard({
  product,
  currency,
  lowStockLimit,
  allowBackorder,
}) {
  const stockState = getStockState(product, {
    lowStockLimit,
    allowBackorder,
  });

  const href = `/products/${product.id || product._id}`;
  const badgeClass = BADGE_CLASS[stockState.state] || "bg-[#6b675e]";

  return (
    <article className="group">
      <Link
        href={href}
        className="relative block aspect-[3/4] overflow-hidden rounded-sm bg-[#f4f1ea]"
      >
        {product.status === "sale"  ||  product.oldPrice ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#2C2523] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
            Sale
          </span>
        ) : null}

        <span
          className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white ${badgeClass}`}
        >
          {stockState.label}
        </span>

        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="mt-4 space-y-1.5">
        <h3 className="text-[13px] font-medium leading-snug tracking-tight text-[#2C2523] sm:text-sm">
          <Link href={href} className="transition hover:text-[#A86B74]">
            {product.title}
          </Link>
        </h3>

        <p className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-[#2C2523]">
            {formatPrice(product.price, currency)}
          </span>
          {product.oldPrice ? (
            <span className="text-xs text-[#A89F94] line-through">
              {formatPrice(product.oldPrice, currency)}
            </span>
          ) : null}
        </p>

        {stockState.state !== "available" ? (
          <p
            className={`text-[11px] leading-5 ${
              stockState.canAddToCart ? "text-[#b7791f]" : "text-[#b3453b]"
            }`}
          >
            {stockState.message}
          </p>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {(product.colors ?? []).map((color) => (
              <span
                key={color}
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}