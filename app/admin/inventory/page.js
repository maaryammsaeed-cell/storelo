"use client";

import { formatPrice, formatPriceShort } from "@/lib/format";
import { useCurrency } from "@/lib/useCurrency";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ITEMS_PER_PAGE = 8;
const LOW_STOCK_LIMIT = 10;

function getStockStatus(stock) {
  if (stock <= 0) {
    return {
      label: "Out of Stock",
      badge: "bg-rose-100 text-rose-700",
      dot: "bg-rose-500",
      bar: "bg-rose-400",
      text: "text-rose-600",
    };
  }

  if (stock <= LOW_STOCK_LIMIT) {
    return {
      label: "Low Stock",
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      bar: "bg-amber-400",
      text: "text-amber-600",
    };
  }

  return {
    label: "In Stock",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    bar: "bg-emerald-400",
    text: "text-emerald-600",
  };
}

export default function InventoryPage() {

  const currency = useCurrency();   // 👈 pehli line
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadInventory() {
      try {
        const response = await fetch("/api/inventory", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load inventory");
        }

        const data = await response.json();

        if (active) {
          setProducts(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch {
        if (active) {
          setError(
            "We couldn't load inventory. Please check your internet connection and try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  function handleRefresh() {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  }

  const summary = useMemo(() => {
    const total = products.length;

    const outOfStock = products.filter(
      (product) => Number(product.stock) <= 0
    ).length;

    const lowStock = products.filter((product) => {
      const stock = Number(product.stock);
      return stock > 0 && stock <= LOW_STOCK_LIMIT;
    }).length;

    const inStock = total - outOfStock - lowStock;

    const totalUnits = products.reduce(
      (sum, product) => sum + Number(product.stock || 0),
      0
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum + Number(product.price || 0) * Number(product.stock || 0),
      0
    );

    return {
      total,
      inStock,
      lowStock,
      outOfStock,
      totalUnits,
      inventoryValue,
    };
  }, [products]);

  const healthPercent = summary.total
    ? Math.round((summary.inStock / summary.total) * 100)
    : 0;

  const lowPercent = summary.total
    ? (summary.lowStock / summary.total) * 100
    : 0;

  const donutBackground = summary.total
    ? `conic-gradient(#34d399 0% ${healthPercent}%, #fbbf24 ${healthPercent}% ${healthPercent + lowPercent
    }%, #fb7185 ${healthPercent + lowPercent}% 100%)`
    : "#f3e8ef";

  const stats = [
    {
      title: "Total Products",
      value: summary.total,
      hint: "SKUs in catalog",
      icon: BoxIcon,
      iconClass: "bg-pink-100 text-pink-600",
    },
    {
      title: "In Stock",
      value: summary.inStock,
      hint: "Healthy levels",
      icon: CheckIcon,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Low Stock",
      value: summary.lowStock,
      hint: "Restock soon",
      icon: AlertIcon,
      iconClass: "bg-amber-100 text-amber-600",
    },
    {
      title: "Out of Stock",
      value: summary.outOfStock,
      hint: "Unavailable",
      icon: XIcon,
      iconClass: "bg-rose-100 text-rose-600",
    },
  ];

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        (product.title || "").toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query);

      const status = getStockStatus(Number(product.stock)).label;
      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, selectedStatus]);

  const attentionList = useMemo(() => {
    return [...products]
      .filter((product) => Number(product.stock) <= LOW_STOCK_LIMIT)
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 5);
  }, [products]);

  const categoryStats = useMemo(() => {
    const counts = products.reduce((acc, product) => {
      const category = product.category || "Other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const list = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const max = Math.max(...list.map((item) => item.count), 1);

    return list.map((item) => ({
      ...item,
      percent: (item.count / max) * 100,
    }));
  }, [products]);

  const filterCounts = {
    all: summary.total,
    "In Stock": summary.inStock,
    "Low Stock": summary.lowStock,
    "Out of Stock": summary.outOfStock,
  };

  const totalPages =
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <section className="min-w-0 flex-1">
      {/* ---------- Hero ---------- */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-[#f0e2d0] bg-gradient-to-br from-[#fdf6ec] via-white to-pink-50 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-[#f7e6c8]/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-44 w-44 rounded-full bg-pink-200/40 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ead7bd] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a6b3f]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Stockroom
            </span>

            <h1 className="mt-4 font-playfair text-3xl leading-tight text-[#831843] sm:text-4xl">
              Inventory Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#9d6b82]">
              A live look at what&apos;s on your shelves — healthy stock, items
              that need a restock, and products that are sold out.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#7c4a5e] shadow-sm ring-1 ring-[#f0e2d0]">
                {summary.totalUnits.toLocaleString("en-US")} units on hand
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#7c4a5e] shadow-sm ring-1 ring-[#f0e2d0]">
                {formatPriceShort(summary.inventoryValue, currency, {
                  maximumFractionDigits: 0,
                })}{" "}
                stock value
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                Read-only demo
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#831843] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6b1236] disabled:opacity-60"
            >
              <RefreshIcon
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh stock
            </button>
          </div>
          <Link
            href="/admin/inventory/manage"
            className="mt-5 ml-3 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            Manage Inventory
          </Link>

          {/* Donut + legend */}
          <div className="flex shrink-0 items-center gap-6 rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <div
              className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
              style={{ background: donutBackground }}
              aria-hidden="true"
            >
              <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="font-playfair text-2xl font-bold text-[#831843]">
                    {healthPercent}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[#9d6b82]">
                    healthy
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-2.5 text-sm">
              <LegendRow
                color="bg-emerald-400"
                label="In Stock"
                value={summary.inStock}
              />
              <LegendRow
                color="bg-amber-400"
                label="Low Stock"
                value={summary.lowStock}
              />
              <LegendRow
                color="bg-rose-400"
                label="Out of Stock"
                value={summary.outOfStock}
              />
            </ul>
          </div>
        </div>
      </header>

      {/* ---------- KPI strip ---------- */}
      <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.title}
              className="border-b border-pink-50 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9d6b82]">
                  {stat.title}
                </p>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${stat.iconClass}`}
                >
                  <Icon />
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-[#831843] sm:text-3xl">
                {loading ? "—" : stat.value}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9d6b82]">{stat.hint}</p>
            </article>
          );
        })}
      </div>

      {/* ---------- Toolbar ---------- */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d6b82]" />
          <input
            type="text"
            placeholder="Search by product or category..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-full border border-pink-100 bg-[#fdf2f8]/40 py-2.5 pl-11 pr-4 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "In Stock", "Low Stock", "Out of Stock"].map((filter) => {
            const active = selectedStatus === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setSelectedStatus(filter);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${active
                    ? "bg-[#831843] text-white shadow-sm"
                    : "bg-pink-50 text-pink-700 hover:bg-pink-100"
                  }`}
              >
                {filter === "all" ? "All" : filter}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-white text-[#9d6b82]"
                    }`}
                >
                  {filterCounts[filter]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Content ---------- */}
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-pink-50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-lg font-medium text-[#831843]">
                  No products match your search
                </p>
                <p className="mt-1 text-sm text-[#9d6b82]">
                  Try a different search or select another stock filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("all");
                    setCurrentPage(1);
                  }}
                  className="mt-4 rounded-xl bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 transition hover:bg-pink-100"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-[#fdf6ec] text-[#831843]">
                      <tr>
                        {["Product", "Price", "Rating", "Stock", "Status"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="border-b border-[#f0e2d0] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {currentItems.map((product) => {
                        const stock = Number(product.stock);
                        const status = getStockStatus(stock);
                        const barWidth = Math.min(Math.max(stock, 0), 100);

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-pink-50 transition last:border-0 hover:bg-[#fdf6ec]/60"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  loading="lazy"
                                  className="h-11 w-11 shrink-0 rounded-xl border border-[#f0e2d0] bg-white object-contain p-1"
                                  onError={(event) => {
                                    event.currentTarget.src =
                                      "/images/products/tshirt.jpg";
                                  }}
                                />
                                <div className="min-w-0">
                                  <p
                                    className="max-w-[220px] truncate font-medium text-[#5b2b3d]"
                                    title={product.title}
                                  >
                                    {product.title}
                                  </p>
                                  <p className="mt-0.5 text-[11px] capitalize text-[#9d6b82]">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#831843]">
                              {formatPrice(product.price, currency)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-[#7c4a5e]">
                              <span className="text-amber-500">★</span>{" "}
                              {Number(product.rating?.rate || 0).toFixed(1)}
                              <span className="ml-1 text-[11px] text-[#9d6b82]">
                                ({product.rating?.count || 0})
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-8 text-right font-semibold ${status.text}`}
                                >
                                  {stock}
                                </span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-pink-50">
                                  <div
                                    className={`h-full rounded-full ${status.bar}`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${status.badge}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                />
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pink-100 px-4 py-3">
                  <p className="text-xs text-[#9d6b82]">
                    Showing {startIndex + 1}–
                    {Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      filteredProducts.length
                    )}{" "}
                    of {filteredProducts.length}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-full border border-pink-100 px-3 py-1.5 text-xs font-medium text-[#831843] transition hover:bg-pink-50 disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="text-xs text-[#9d6b82]">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      disabled={currentPage >= totalPages}
                      className="rounded-full border border-pink-100 px-3 py-1.5 text-xs font-medium text-[#831843] transition hover:bg-pink-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Side panels */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#f0e2d0] bg-gradient-to-b from-[#fdf6ec] to-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#831843]">
                  Needs Attention
                </h2>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  {summary.lowStock + summary.outOfStock}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#9d6b82]">
                Lowest stock items — restock these first.
              </p>

              {attentionList.length === 0 ? (
                <p className="mt-4 rounded-xl bg-white p-3 text-xs text-[#9d6b82]">
                  Everything is well stocked.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {attentionList.map((product) => {
                    const stock = Number(product.stock);
                    const status = getStockStatus(stock);

                    return (
                      <li
                        key={product.id}
                        className="flex items-center gap-3 rounded-xl bg-white/80 p-2.5 ring-1 ring-[#f0e2d0]"
                      >
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="lazy"
                          className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
                          onError={(event) => {
                            event.currentTarget.src =
                              "/images/products/tshirt.jpg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-xs font-medium text-[#5b2b3d]"
                            title={product.title}
                          >
                            {product.title}
                          </p>
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-pink-100">
                            <div
                              className={`h-full rounded-full ${status.bar}`}
                              style={{
                                width: `${Math.min(Math.max(stock, 0), 10) * 10}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}
                        >
                          {stock}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#831843]">
                Top Categories
              </h2>
              <p className="mt-1 text-xs text-[#9d6b82]">
                Where most of your catalog sits.
              </p>

              <div className="mt-4 space-y-3">
                {categoryStats.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate capitalize text-[#5b2b3d]">
                        {item.category}
                      </span>
                      <span className="font-semibold text-[#831843]">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-pink-50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#e7b7c8] to-[#831843]"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}

/* ---------- Small helpers ---------- */

function LegendRow({ color, label, value }) {
  return (
    <li className="flex items-center gap-2.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[#7c4a5e]">{label}</span>
      <span className="ml-auto font-semibold text-[#831843]">{value}</span>
    </li>
  );
}

/* ---------- Icons ---------- */

function IconBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function BoxIcon() {
  return (
    <IconBase>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </IconBase>
  );
}

function CheckIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </IconBase>
  );
}

function AlertIcon() {
  return (
    <IconBase>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5M12 18h.01" />
    </IconBase>
  );
}

function XIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </IconBase>
  );
}

function SearchIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 1 0-2.3 6.3" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}
