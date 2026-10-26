"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("orders-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const itemsPerPage = 7;

  // Fetch customers from internal API
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch {
      // Fallback handled automatically by API route
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Compute 4 Summary Cards from customers API data
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "Active").length;
    const vip = customers.filter((c) => c.status === "VIP").length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    return [
      {
        title: "Total Customers",
        value: total,
        description: "Registered accounts in database",
        icon: UsersIcon,
        bgClass: "bg-pink-50/60 border-pink-100",
        iconClass: "text-pink-600 bg-pink-100/70",
      },
      {
        title: "Active Accounts",
        value: active,
        description: "Engaged shoppers this month",
        icon: CheckCircleIcon,
        bgClass: "bg-emerald-50/50 border-emerald-100",
        iconClass: "text-emerald-600 bg-emerald-100/70",
      },
      {
        title: "VIP Clients",
        value: vip,
        description: "High-value top tier buyers",
        icon: SparklesIcon,
        bgClass: "bg-purple-50/50 border-purple-100",
        iconClass: "text-purple-600 bg-purple-100/70",
      },
      {
        title: "Customer Lifetime Value",
        value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        description: "Total revenue across all shoppers",
        icon: CurrencyDollarIcon,
        bgClass: "bg-amber-50/50 border-amber-100",
        iconClass: "text-amber-600 bg-amber-100/70",
      },
    ];
  }, [customers]);

  // Filter & Sort customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = customers.filter((item) => {
      const name = `${item.name?.firstname || ""} ${item.name?.lastname || ""}`.toLowerCase();
      const email = (item.email || "").toLowerCase();
      const username = (item.username || "").toLowerCase();
      const city = (item.address?.city || "").toLowerCase();
      const matchesSearch = name.includes(q) || email.includes(q) || username.includes(q) || city.includes(q);

      const matchesStatus =
        selectedStatus === "all" ||
        item.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    if (sortBy === "orders-desc") {
      result.sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
    } else if (sortBy === "spend-desc") {
      result.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) =>
        `${a.name?.firstname}`.localeCompare(`${b.name?.firstname}`)
      );
    }

    return result;
  }, [customers, searchQuery, selectedStatus, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="min-w-0 flex-1">
      {/* Page Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Customer Relationships
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Customers Directory
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            View, search, and manage registered store customers and accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50 disabled:opacity-50"
            title="Refresh customer data"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <span className="rounded-xl border border-pink-100 bg-white px-4 py-2 text-xs font-semibold text-[#831843] shadow-sm">
            {filteredCustomers.length} Customers Found
          </span>

          <button
            type="button"
            onClick={() => alert("Add Customer modal placeholder — ready for backend connection.")}
            className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </header>

      {/* 4 Summary Cards (Above Search Bar) */}
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
                <p className="mt-1 text-xs text-[#9d6b82]">{stat.description}</p>
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
            placeholder="Search customer by name, email, city..."
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
            <option value="Active">Active Only</option>
            <option value="VIP">VIP Only</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-pink-100 bg-white px-3 py-2.5 text-sm font-medium text-[#831843] outline-none transition focus:border-pink-300"
          >
            <option value="orders-desc">Most Orders</option>
            <option value="spend-desc">Highest Spend</option>
            <option value="name-asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
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
      ) : filteredCustomers.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">No customers found</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Try clearing your search query or reset the status filters.
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
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Contact Details</th>
                  <th className="px-5 py-3.5 font-medium">Location</th>
                  <th className="px-5 py-3.5 font-medium">Orders & Spend</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((cust) => {
                  const firstName = cust.name?.firstname || "User";
                  const lastName = cust.name?.lastname || "";
                  const fullName = `${firstName} ${lastName}`.trim();
                  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "CU";

                  return (
                    <tr
                      key={cust.id}
                      className="border-b border-pink-100 transition odd:bg-pink-50/20 hover:bg-pink-50/60"
                    >
                      {/* Customer Profile */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 font-bold text-[#831843]">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold capitalize text-[#831843]">
                              {fullName}
                            </p>
                            <p className="text-xs text-[#9d6b82]">@{cust.username || "shopper"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-[#3f1d2e]">{cust.email}</p>
                        <p className="mt-0.5 text-xs text-[#9d6b82]">{cust.phone || "No phone"}</p>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5 capitalize text-[#5b2b3d]">
                        <p className="text-xs font-medium">{cust.address?.city || "Unknown City"}</p>
                        <p className="text-[11px] text-[#9d6b82]">{cust.address?.zipcode || "Postal Area"}</p>
                      </td>

                      {/* Orders & Spend */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-pink-100/70 px-2 py-0.5 text-xs font-bold text-[#831843]">
                            {cust.ordersCount || 0} orders
                          </span>
                          <span className="text-xs font-semibold text-[#831843]">
                            ${Number(cust.totalSpent || 0).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            cust.status === "VIP"
                              ? "bg-purple-100 text-purple-800"
                              : cust.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cust.status === "VIP"
                                ? "bg-purple-600"
                                : cust.status === "Active"
                                ? "bg-emerald-600"
                                : "bg-amber-500"
                            }`}
                          />
                          {cust.status || "Active"}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="rounded-lg border border-pink-200 bg-white px-2.5 py-1 text-xs font-medium text-[#831843] transition hover:bg-pink-50"
                          >
                            Details
                          </button>
                          <a
                            href={`mailto:${cust.email}`}
                            className="rounded-lg bg-pink-50 p-1.5 text-pink-700 transition hover:bg-pink-100"
                            title="Send email"
                          >
                            <MailIcon className="h-3.5 w-3.5" />
                          </a>
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
      {filteredCustomers.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-between border-t border-pink-100 pt-4 text-sm text-[#9d6b82]">
          <p>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of{" "}
            {filteredCustomers.length} customers
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 font-bold text-[#831843]">
                  {`${selectedCustomer.name?.firstname?.[0] || ""}${selectedCustomer.name?.lastname?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-playfair text-xl capitalize text-[#831843]">
                    {selectedCustomer.name?.firstname} {selectedCustomer.name?.lastname}
                  </h3>
                  <p className="text-xs text-[#9d6b82]">@{selectedCustomer.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-pink-50 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-[#fdf2f8]/50 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Email Address:</span>
                <span className="font-medium text-[#831843]">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Phone:</span>
                <span className="font-medium text-[#831843]">{selectedCustomer.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Address:</span>
                <span className="capitalize font-medium text-[#831843]">
                  {selectedCustomer.address?.street}, {selectedCustomer.address?.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Orders Placed:</span>
                <span className="font-bold text-[#831843]">{selectedCustomer.ordersCount} orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Total Spending:</span>
                <span className="font-bold text-pink-600">${Number(selectedCustomer.totalSpent || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9d6b82]">Status:</span>
                <span className="font-semibold text-emerald-700">{selectedCustomer.status}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl border border-pink-200 px-4 py-2 text-xs font-semibold text-[#831843] hover:bg-pink-50"
              >
                Close
              </button>
              <a
                href={`mailto:${selectedCustomer.email}`}
                className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-pink-700"
              >
                Send Message
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Lightweight Inline Icons ---------------- */
function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function CurrencyDollarIcon({ className }) {
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

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
