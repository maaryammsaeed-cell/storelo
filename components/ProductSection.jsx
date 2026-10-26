"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";

// Filter tabs. Naya filter chahiye to yahan add karo
// (product.category ki value se match hona chahiye).
const filters = ["All Products", "Men", "Women"];

export default function ProductSection({ products }) {
  const [activeFilter, setActiveFilter] = useState("All Products");

  const visibleProducts =
    activeFilter === "All Products"
      ? products
      : products.filter((product) => product.category === activeFilter);

  return (
    <section id="products" className="bg-white px-5 pb-24 pt-16 sm:px-8 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        {/* Big heading + filter tabs */}
        <div className="border-b border-[#e7e3da] pb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#8f8a7d]">
            New Season
          </p>
          <h2 className="mt-4 font-playfair text-5xl leading-none tracking-tight text-[#1f2119] sm:text-6xl">
            Products
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#6b675e] sm:text-base">
            Discover our newest arrivals — thoughtfully designed pieces for
            everyday style and lasting comfort.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-7 text-sm">
            {filters.map((filter) => {
              const isActive = filter === activeFilter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={
                    isActive
                      ? "border-b-2 border-[#1f2119] pb-1 text-[#1f2119]"
                      : "pb-1 text-[#8b8679] transition hover:text-[#1f2119]"
                  }
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products grid */}
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <p className="mt-10 text-sm text-[#8b8679]">
            Is category me filhal koi product nahi hai.
          </p>
        ) : null}
      </div>
    </section>
  );
}
