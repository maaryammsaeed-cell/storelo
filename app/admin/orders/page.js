"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const itemsPerPage = 7;

  // Fetch orders from internal API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      // Fallback handled automatically
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Compute 5 Summary Cards from orders API data
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const processing = orders.filter((o) => o.status === "Processing").length;
    const shipped = orders.filter((o) => o.status === "Shipped").length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return [
      {
        title: "Total Orders",
        value: total,
        description: "All customer purchases",
        icon: ShoppingBagIcon,
        bgClass: "bg-pink-50/60 border-pink-100",
        iconClass: "text-pink-600 bg-pink-100/70",
      },
      {
        title: "Delivered",
        value: delivered,
        description: "Completed shipments",
        icon: CheckCircleIcon,
        bgClass: "bg-emerald-50/50 border-emerald-100",
        iconClass: "text-emerald-600 bg-emerald-100/70",
      },
      {
        title: "Processing",
        value: processing,
        description: "Awaiting packaging",
        icon: ClockIcon,
        bgClass: "bg-amber-50/50 border-amber-100",
        iconClass: "text-amber-600 bg-amber-100/70",
      },
      {
        title: "Shipped",
        value: shipped,
        description: "In transit with courier",
        icon: TruckIcon,
        bgClass: "bg-blue-50/50 border-blue-100",
        iconClass: "text-blue-600 bg-blue-100/70",
      },
      {
        title: "Total Revenue",
        value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        description: "Gross order sales value",
        icon: DollarSignIcon,
        bgClass: "bg-purple-50/50 border-purple-100",
        iconClass: "text-purple-600 bg-purple-100/70",
      },
    ];
  }, [orders]);

  // Filter & Sort orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = orders.filter((order) => {
      const orderNum = (order.orderNumber || "").toLowerCase();
      const customerName = (order.customer?.name || "").toLowerCase();
      const customerEmail = (order.customer?.email || "").toLowerCase();
      const items = (order.itemsSummary || "").toLowerCase();
      const matchesSearch =
        orderNum.includes(q) ||
        customerName.includes(q) ||
        customerEmail.includes(q) ||
        items.includes(q);

      const matchesStatus =
        selectedStatus === "all" ||
        order.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    } else if (sortBy === "amount-desc") {
      result.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === "amount-asc") {
      result.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    }

    return result;
  }, [orders, searchQuery, selectedStatus, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return {
          bg: "bg-emerald-100 text-emerald-800",
          dot: "bg-emerald-600",
        };
      case "Shipped":
        return {
          bg: "bg-blue-100 text-blue-800",
          dot: "bg-blue-600",
        };
      case "Processing":
        return {
          bg: "bg-amber-100 text-amber-800",
          dot: "bg-amber-500",
        };
      case "Cancelled":
        return {
          bg: "bg-rose-100 text-rose-800",
          dot: "bg-rose-500",
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-800",
          dot: "bg-gray-500",
        };
    }
  };

  return (
    <section className="min-w-0 flex-1">
      {/* Page Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Order Fulfillment
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Orders Directory
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Track, fulfill, and monitor customer orders across all channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50 disabled:opacity-50"
            title="Refresh order data"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <span className="rounded-xl border border-pink-100 bg-white px-4 py-2 text-xs font-semibold text-[#831843] shadow-sm">
            {filteredOrders.length} Orders Found
          </span>

          <button
            type="button"
            onClick={() => alert("Export orders CSV placeholder")}
            className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            <DownloadIcon className="h-4 w-4" />
            Export Orders
          </button>
        </div>
      </header>

      {/* 5 Summary Cards (Above Search Bar) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.title}
              className={`rounded-2xl border bg-white p-4.5 shadow-sm transition hover:shadow-md ${stat.bgClass}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7c4a5e]">
                  {stat.title}
                </p>
                <span className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl ${stat.iconClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-7 w-16 animate-pulse rounded-lg bg-pink-100" />
                ) : (
                  <p className="font-playfair text-2xl font-bold text-[#831843]">
                    {stat.value}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#9d6b82]">{stat.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d6b82]" />
          <input
            type="text"
            placeholder="Search by order ID (ORD-9201), customer name, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-[#fdf2f8]/40 py-2.5 pl-10 pr-4 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-pink-100 bg-white px-3 py-2.5 text-sm font-medium text-[#831843] outline-none transition focus:border-pink-300"
          >
            <option value="all">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Shipped">Shipped</option>
            <option value="Processing">Processing</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-pink-100 bg-white px-3 py-2.5 text-sm font-medium text-[#831843] outline-none transition focus:border-pink-300"
          >
            <option value="latest">Latest Date</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        /* Loading Skeletons */
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">No orders match your criteria</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Try adjusting your search terms or clearing status filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("all");
            }}
            className="mt-4 rounded-xl bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 transition hover:bg-pink-100"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Detailed Table */
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FCA5A5] text-white">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Order & Date</th>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Package Items</th>
                  <th className="px-5 py-3.5 font-medium">Total & Payment</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const formattedDate = new Date(order.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-pink-100 transition odd:bg-pink-50/20 hover:bg-pink-50/60"
                    >
                      {/* Order & Date */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-[#831843]">{order.orderNumber}</p>
                        <p className="text-xs text-[#9d6b82]">{formattedDate}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-pink-100 font-bold text-xs text-[#831843]">
                            {order.customer?.avatar || "CU"}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-[#831843]">
                              {order.customer?.name}
                            </p>
                            <p className="text-[11px] text-[#9d6b82]">{order.customer?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Package Items */}
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-pink-100/60 px-2 py-0.5 text-xs font-semibold text-[#831843]">
                          {order.itemsCount || 1} {order.itemsCount === 1 ? "item" : "items"}
                        </span>
                        <p className="mt-1 line-clamp-1 max-w-[200px] text-xs text-[#5b2b3d]" title={order.itemsSummary}>
                          {order.itemsSummary}
                        </p>
                      </td>

                      {/* Total & Payment */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-[#831843]">
                          ${Number(order.totalAmount || 0).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#9d6b82]">
                          <span>{order.paymentMethod}</span>
                          <span>•</span>
                          <span className={order.paymentStatus === "Paid" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {order.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg border border-pink-200 bg-white px-2.5 py-1 text-xs font-medium text-[#831843] transition hover:bg-pink-50"
                          >
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredOrders.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-between border-t border-pink-100 pt-4 text-sm text-[#9d6b82]">
          <p>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
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

      {/* Order Invoice Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-pink-100 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-pink-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
                  Receipt & Slip
                </span>
                <h3 className="font-playfair text-2xl font-bold text-[#831843]">
                  {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#9d6b82]">
                  Placed on {new Date(selectedOrder.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-pink-50 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl bg-[#fdf2f8]/50 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Customer:</span>
                <span className="font-semibold text-[#831843]">{selectedOrder.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Email:</span>
                <span className="font-medium text-[#831843]">{selectedOrder.customer?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Products Package:</span>
                <span className="font-medium text-[#831843]">{selectedOrder.itemsSummary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Payment Method:</span>
                <span className="font-medium text-[#831843]">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Payment Status:</span>
                <span className="font-bold text-emerald-600">{selectedOrder.paymentStatus}</span>
              </div>
              <div className="flex justify-between border-t border-pink-100 pt-2 text-sm">
                <span className="font-semibold text-[#831843]">Total Paid:</span>
                <span className="font-bold text-pink-600">${Number(selectedOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-pink-200 px-4 py-2 text-xs font-semibold text-[#831843] hover:bg-pink-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert(`Invoice printed for ${selectedOrder.orderNumber}`)}
                className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-pink-700"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Lightweight Inline Icons ---------------- */
function ShoppingBagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
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

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TruckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="16" height="13" x="1" y="4" rx="2" />
      <polygon points="17 8 20 8 23 11 23 17 17 17 17 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function DollarSignIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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

function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
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
