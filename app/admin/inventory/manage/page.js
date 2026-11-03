"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const LOW_STOCK_LIMIT = 10;

function getStatus(stock) {
  if (stock <= 0) {
    return { label: "Out of Stock", className: "bg-rose-50 text-rose-700" };
  }
  if (stock <= LOW_STOCK_LIMIT) {
    return { label: "Low Stock", className: "bg-amber-50 text-amber-700" };
  }
  return { label: "In Stock", className: "bg-emerald-50 text-emerald-700" };
}

export default function ManageInventoryPage() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  // ---------- READ ----------
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });

      if (res.status === 401) {
        setError("Session khatam ho gaya. Dobara login karo.");
        return;
      }

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      setItems(list);

      const nextDrafts = {};
      list.forEach((item) => {
        nextDrafts[item.id] = String(item.stock ?? 0);
      });
      setDrafts(nextDrafts);
    } catch {
      setError("Inventory load nahi hui. Terminal check karo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, [loadItems]);

  // Message 3 second baad gayab
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // ---------- UPDATE ----------
  async function saveStock(item) {
    const value = Number(drafts[item.id]);

    if (Number.isNaN(value) || value < 0) {
      setError("Stock 0 ya us se zyada hona chahiye.");
      return;
    }

    setSavingId(item.id);
    setError("");

    try {
      const res = await fetch(`/api/admin/products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: value }),
      });

      if (!res.ok) throw new Error("Save failed");

      setItems((current) =>
        current.map((product) =>
          product.id === item.id ? { ...product, stock: value } : product
        )
      );

      setMessage(`"${item.title}" ka stock ${value} save ho gaya ✅`);
    } catch {
      setError("Stock save nahi hua. Dobara try karo.");
    } finally {
      setSavingId(null);
    }
  }

  function changeDraft(id, value) {
    setDrafts((current) => ({ ...current, [id]: value }));
  }

  function bumpStock(id, delta) {
    const current = Number(drafts[id] ?? 0);
    const next = Math.max(0, current + delta);
    changeDraft(id, String(next));
  }

  // ---------- FILTER ----------
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();

    return items.filter((item) => {
      const matchesSearch =
        (item.title || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q);

      const stock = Number(drafts[item.id] ?? item.stock ?? 0);
      const matchesLow = !lowOnly || stock <= LOW_STOCK_LIMIT;

      return matchesSearch && matchesLow;
    });
  }, [items, drafts, search, lowOnly]);

  const lowCount = items.filter(
    (item) => Number(item.stock ?? 0) <= LOW_STOCK_LIMIT
  ).length;

  const outCount = items.filter(
    (item) => Number(item.stock ?? 0) <= 0
  ).length;

  return (
    <section className="min-w-0 flex-1">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Stock Control
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Manage Inventory
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Stocks stored in database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/inventory"
            className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50"
          >
            View Inventory
          </Link>
          <Link
            href="/admin/products/manage"
            className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            + Add New Product
          </Link>
        </div>
      </header>

      {/* Summary */}
      <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="rounded-full bg-white px-3 py-1.5 text-[#831843] ring-1 ring-pink-100">
          {items.length} items
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-100">
          {lowCount} low stock
        </span>
        <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-700 ring-1 ring-rose-100">
          {outCount} out of stock
        </span>
      </div>

      {/* Banners */}
      {message && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by item or category..."
          className="w-full rounded-xl border border-pink-100 bg-[#fdf2f8]/40 px-4 py-2.5 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100 sm:max-w-md"
        />

        <label className="flex items-center gap-2 text-sm font-medium text-[#831843]">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(event) => setLowOnly(event.target.checked)}
            className="h-4 w-4 accent-pink-600"
          />
          Low stock only
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-pink-100" />
          <div className="mt-4 h-10 rounded bg-pink-50" />
          <div className="mt-3 h-10 rounded bg-pink-50" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">Koi item nahi mila</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Search clear karo ya &quot;Add New Product&quot; se naya item banao.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stock = Number(drafts[item.id] ?? item.stock ?? 0);
                  const status = getStatus(stock);
                  const changed = stock !== Number(item.stock ?? 0);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-pink-100 odd:bg-pink-50/30 hover:bg-pink-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-pink-100 bg-white p-1">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-contain"
                              onError={(event) => {
                                event.currentTarget.src = "/images/products/tshirt.jpg";
                              }}
                            />
                          </div>
                          <span className="font-medium text-[#831843]">
                            {item.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 capitalize text-[#5b2b3d]">
                        {item.category || "General"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => bumpStock(item.id, -1)}
                            className="h-7 w-7 rounded-lg border border-pink-200 text-sm font-bold text-[#831843] transition hover:bg-pink-50"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={drafts[item.id] ?? ""}
                            onChange={(event) =>
                              changeDraft(item.id, event.target.value)
                            }
                            className="w-16 rounded-lg border border-pink-100 px-2 py-1 text-center text-sm outline-none focus:border-pink-300"
                          />
                          <button
                            type="button"
                            onClick={() => bumpStock(item.id, 1)}
                            className="h-7 w-7 rounded-lg border border-pink-200 text-sm font-bold text-[#831843] transition hover:bg-pink-50"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => saveStock(item)}
                          disabled={savingId === item.id || !changed}
                          className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingId === item.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}