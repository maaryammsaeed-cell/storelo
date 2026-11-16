"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";

// Filter tabs. Naya filter chahiye to yahan add karo
// (product.category ki value se match hona chahiye).
const filters = ["All Products", "Men", "Women"];

export default function ProductSection({ products , currency , lowStockLimit,
  allowBackorder,}) {
  const [activeFilter, setActiveFilter] = useState("All Products");

  const visibleProducts =
    activeFilter === "All Products"
      ? products
      : products.filter((product) => product.category === activeFilter);

  return (
    <section id="products" className="bg-transparent px-5 pb-24 pt-16 sm:px-8 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        {/* Heading + filter tabs */}
        <div className="text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.35em] text-[#A86B74]">
            <span className="h-px w-8 bg-[#A86B74]/40" />
            New Season
            <span className="h-px w-8 bg-[#A86B74]/40" />
          </p>

          <h2 className="mt-5 font-playfair text-4xl leading-[1.05] tracking-tight text-[#2C2523] sm:text-6xl">
            Products
          </h2>

          <span className="mx-auto mt-4 block h-px w-16 bg-gradient-to-r from-transparent via-[#A86B74]/70 to-transparent" />

          <p className="mx-auto mt-4 max-w-xl text-[13px] leading-7 text-[#7A6F6B] sm:text-[15px]">
            Discover our newest arrivals — thoughtfully designed pieces for
            everyday style and lasting comfort.
          </p>

          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-[#E5D5D0] bg-white/60 p-1.5 shadow-sm backdrop-blur">
            {filters.map((filter) => {
              const isActive = filter === activeFilter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                    isActive
                      ? "bg-[#2C2523] text-white shadow-sm"
                      : "text-[#7A6F6B] hover:bg-white hover:text-[#2C2523]"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products grid */}
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id || product._id} product={product}  currency={currency}    lowStockLimit={lowStockLimit}
  allowBackorder={allowBackorder}/>
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <p className="mt-12 rounded-xl border border-dashed border-[#E5D5D0] bg-white/50 px-6 py-10 text-center text-sm text-[#7A6F6B]">
            There are no products in this category yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
