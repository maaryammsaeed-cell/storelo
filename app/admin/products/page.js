"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { demoProducts } from "@/data/products";

// Standardize product structure from any data source (API or local demo)
function normalizeProduct(item, index) {
  // Determine active/inactive status from API fields or deterministic fallback
  const isActive =
    item.status !== undefined
      ? item.status === "active"
      : item.isActive !== undefined
      ? Boolean(item.isActive)
      : item.stock !== undefined
      ? Number(item.stock) > 0
      : (index + 1) % 6 !== 0; // ~83% active, ~17% inactive

  return {
    id: item.id || item._id || `product-${index}`,
    title: item.title || "Storelo Product",
    price: Number(item.price || 0),
    description:
      item.description ||
      `Premium ${item.category || "apparel"} item with high quality craftsmanship.`,
    category: item.category || "General",
    image: item.image || "/images/products/tshirt.jpg",
    isActive,
    status: isActive ? "active" : "inactive",
    rating: {
      rate:
        typeof item.rating === "number"
          ? item.rating
          : Number(item.rating?.rate ?? 4.7),
      count: Number(item.reviews ?? (item.rating?.count ?? 35)),
    },
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("loading"); // "live", "fallback", "loading"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reliable fetch with multi-stage fallback
  const fetchProducts = useCallback(async () => {
    setLoading(true);

    const loadFallback = () => {
      const fallbackList = demoProducts.map(normalizeProduct);
      setProducts(fallbackList);
      setDataSource("fallback");
    };

    try {
      // 1. Try internal Next.js API route first
      const internalRes = await fetch("/api/products", { cache: "no-store" }).catch(() => null);
      if (internalRes && internalRes.ok) {
        const data = await internalRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.map(normalizeProduct));
          setDataSource("live");
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to local demo data
      loadFallback();
    } catch {
      loadFallback();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!products || products.length === 0) return ["all"];
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["all", ...unique];
  }, [products]);

  // Compute 4 Stat Cards from received API data
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    const categoryCount = categories.filter((c) => c !== "all").length;

    return [
      {
        title: "Total Products",
        value: total,
        description: "All products received from API",
        icon: BoxIcon,
        bgClass: "bg-pink-50 border-pink-100",
        iconClass: "text-pink-600 bg-pink-100/70",
      },
      {
        title: "Active Products",
        value: active,
        description: "In stock and ready for sale",
        icon: CheckCircleIcon,
        bgClass: "bg-emerald-50/50 border-emerald-100",
        iconClass: "text-emerald-600 bg-emerald-100/70",
      },
      {
        title: "Inactive Products",
        value: inactive,
        description: "Out of stock or draft status",
        icon: PauseCircleIcon,
        bgClass: "bg-amber-50/50 border-amber-100",
        iconClass: "text-amber-600 bg-amber-100/70",
      },
      {
        title: "Categories",
        value: categoryCount,
        description: "Unique product categories",
        icon: LayersIcon,
        bgClass: "bg-purple-50/50 border-purple-100",
        iconClass: "text-purple-600 bg-purple-100/70",
      },
    ];
  }, [products, categories]);

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((item) => {
      const titleMatch = (item.title || "").toLowerCase().includes(q);
      const descMatch = (item.description || "").toLowerCase().includes(q);
      const categoryMatch =
        selectedCategory === "all" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      return (titleMatch || descMatch) && categoryMatch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="min-w-0 flex-1">
      {/* Page Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Inventory Management
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Products Directory
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Browse, search, and manage products for your Storelo catalogue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50 disabled:opacity-50"
            title="Refresh inventory from API"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <span className="rounded-xl border border-pink-100 bg-white px-4 py-2 text-xs font-semibold text-[#831843] shadow-sm">
            {filteredProducts.length} Items Found
          </span>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
            onClick={() => alert("Add Product modal ready to connect with your database.")}
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </header>

      {/* Offline/Fallback Banner */}
      {dataSource === "fallback" && !loading && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            <span>
              Live external API is unreachable. Loaded <strong>Storelo demo products</strong> so you can continue testing seamlessly.
            </span>
          </div>
          <button
            type="button"
            onClick={fetchProducts}
            className="font-semibold underline hover:text-amber-950"
          >
            Retry Live API
          </button>
        </div>
      )}

      {/* 4 Overview Stat Cards (Above the Search Bar) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.title}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${stat.bgClass}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7c4a5e]">
                  {stat.title}
                </p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded-lg bg-pink-100" />
                ) : (
                  <p className="font-playfair text-3xl font-bold text-[#831843]">
                    {stat.value}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#9d6b82]">
                  {stat.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d6b82]" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-[#fdf2f8]/40 py-2.5 pl-10 pr-4 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* Category & View Controls */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-pink-100 bg-white px-3 py-2.5 text-sm font-medium capitalize text-[#831843] outline-none transition focus:border-pink-300"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-pink-100 bg-[#fdf2f8]/50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-white text-pink-700 shadow-sm"
                  : "text-[#9d6b82] hover:text-[#831843]"
              }`}
              title="Grid View"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "table"
                  ? "bg-white text-pink-700 shadow-sm"
                  : "text-[#9d6b82] hover:text-[#831843]"
              }`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
            >
              <div className="aspect-square w-full rounded-xl bg-pink-100/50" />
              <div className="mt-4 h-4 w-2/3 rounded bg-pink-100/60" />
              <div className="mt-2 h-3 w-1/3 rounded bg-pink-100/40" />
              <div className="mt-4 h-4 w-1/2 rounded bg-pink-100/60" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">No products match your search</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Try clearing your search query or selecting another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 rounded-xl bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 transition hover:bg-pink-100"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentItems.map((product) => (
            <article
              key={product.id}
              className="flex flex-col justify-between rounded-2xl border border-pink-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div>
                {/* Product Photo */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#fdf2f8]/30 p-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/images/products/tshirt.jpg";
                    }}
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-800">
                    {product.category}
                  </span>
                  <span
                    className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      product.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Details */}
                <h2
                  className="mt-3 line-clamp-1 text-sm font-semibold text-[#831843]"
                  title={product.title}
                >
                  {product.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs text-[#9d6b82]">
                  {product.description}
                </p>
              </div>

              {/* Price & Rating */}
              <div className="mt-4 flex items-center justify-between border-t border-pink-50 pt-3">
                <span className="text-base font-bold text-[#831843]">
                  ${Number(product.price || 0).toFixed(2)}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  ★ {Number(product.rating?.rate || 0).toFixed(1)}{" "}
                  <span className="text-[11px] text-[#9d6b82]">
                    ({product.rating?.count || 0})
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-pink-100 odd:bg-pink-50/30 hover:bg-pink-50/70"
                  >
                    <td className="flex items-center gap-3 px-4 py-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-pink-100 bg-white p-1">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/images/products/tshirt.jpg";
                          }}
                        />
                      </div>
                      <span className="line-clamp-1 font-medium text-[#831843]">
                        {product.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-[#5b2b3d]">
                      {product.category}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            product.isActive ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#831843]">
                      ${Number(product.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-amber-500">
                      ★ {Number(product.rating?.rate || 0).toFixed(1)}{" "}
                      <span className="text-xs text-[#9d6b82]">
                        ({product.rating?.count || 0})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProducts.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-between border-t border-pink-100 pt-4 text-sm text-[#9d6b82]">
          <p>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="rounded-xl border border-pink-200 bg-white px-3 py-1.5 font-medium text-[#831843] transition hover:bg-pink-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-[#831843]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="rounded-xl border border-pink-200 bg-white px-3 py-1.5 font-medium text-[#831843] transition hover:bg-pink-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Lightweight Inline Icons ---------------- */
function BoxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function PauseCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="10" x2="10" y1="15" y2="9" />
      <line x1="14" x2="14" y1="15" y2="9" />
    </svg>
  );
}

function LayersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function GridIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function TableIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 5h18" />
      <path d="M3 12h18" />
      <path d="M3 19h18" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
    </svg>
  );
}
