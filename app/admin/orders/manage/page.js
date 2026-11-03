"use client";

import { useCurrency } from "@/lib/useCurrency";
import { formatPrice } from "@/lib/format";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  orderNumber: "",
  customerName: "",
  customerEmail: "",
  itemsSummary: "",
  itemsCount: "1",
  totalAmount: "",
  status: "Processing",
  paymentMethod: "Credit Card (Visa)",
  paymentStatus: "Paid",
};

const inputClass =
  "w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100";

export default function ManageOrdersPage() {

   const currency = useCurrency();   // 👈 pehli line
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- READ ----------
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Unable to load orders. Please check terminal/server logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mount par ek dafa data load karna maqsad hai. Ye rule "await" ke baad wala
    // setState pehchan nahi pata, is liye sirf isi call par rule band hai.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, [loadOrders]);

  // Message 3s timeout
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // ---------- FORM OPEN / CLOSE ----------
  function openAddForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(order) {
    setEditingId(order.id);
    setForm({
      orderNumber: order.orderNumber || "",
      customerName: order.customer?.name || "",
      customerEmail: order.customer?.email || "",
      itemsSummary: order.itemsSummary || "",
      itemsCount: String(order.itemsCount ?? 1),
      totalAmount: String(order.totalAmount ?? ""),
      status: order.status || "Processing",
      paymentMethod: order.paymentMethod || "Credit Card (Visa)",
      paymentStatus: order.paymentStatus || "Paid",
    });
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormError("");
  }

  function changeField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // ---------- CREATE + UPDATE ----------
  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.customerName.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    if (!form.customerEmail.trim()) {
      setFormError("Customer email is required.");
      return;
    }

    if (form.totalAmount === "" || Number(form.totalAmount) < 0) {
      setFormError("Total amount must be 0 or higher.");
      return;
    }

    const wasEditing = Boolean(editingId);
    setSaving(true);

    try {
      const url = wasEditing
        ? `/api/admin/orders/${editingId}`
        : "/api/admin/orders";

      const res = await fetch(url, {
        method: wasEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: form.orderNumber.trim(),
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          itemsSummary: form.itemsSummary.trim() || "Store Item",
          itemsCount: Number(form.itemsCount || 1),
          totalAmount: Number(form.totalAmount || 0),
          status: form.status,
          paymentMethod: form.paymentMethod,
          paymentStatus: form.paymentStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Save failed");

      await loadOrders();
      closeForm();
      setMessage(wasEditing ? "Order updated successfully ✅" : "New order created successfully ✅");
    } catch (err) {
      setFormError(err.message || "Failed to save order. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- DELETE ----------
  async function handleDelete(order) {
    const ok = window.confirm(
      `Delete order "${order.orderNumber}" for ${order.customer?.name}? This cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      await loadOrders();
      setMessage("Order deleted successfully 🗑️");
    } catch {
      setError("Order could not be deleted. Please try again.");
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700";
      case "Shipped":
        return "bg-blue-50 text-blue-700";
      case "Processing":
        return "bg-amber-50 text-amber-700";
      case "Cancelled":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <section className="min-w-0 flex-1">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Order Fulfillment
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Manage Orders
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Create new orders, update fulfillment and payment statuses, or remove records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/orders"
            className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50"
          >
            View Directory
          </Link>
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            + Create Order
          </button>
        </div>
      </header>

      {/* Success / error banners */}
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

      {/* Add / Edit Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 font-playfair text-xl text-[#831843]">
            {editingId ? "Edit Order" : "New Order"}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Order Number *
              </label>
              <input
                name="orderNumber"
                value={form.orderNumber}
                onChange={changeField}
                placeholder="ORD-9201"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Customer Name *
              </label>
              <input
                name="customerName"
                value={form.customerName}
                onChange={changeField}
                placeholder="Sophia Anderson"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Customer Email *
              </label>
              <input
                name="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={changeField}
                placeholder="sophia@example.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Items Count
              </label>
              <input
                name="itemsCount"
                type="number"
                min="1"
                value={form.itemsCount}
                onChange={changeField}
                placeholder="1"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Total Amount ($) *
              </label>
              <input
                name="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={changeField}
                placeholder="120.00"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Order Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={changeField}
                className={inputClass}
              >
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Items Summary
              </label>
              <input
                name="itemsSummary"
                value={form.itemsSummary}
                onChange={changeField}
                placeholder="Unisex T-Shirt, Satin Slip Dress"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={changeField}
                className={inputClass}
              >
                <option value="Credit Card (Visa)">Credit Card (Visa)</option>
                <option value="Credit Card (Mastercard)">Credit Card (Mastercard)</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="PayPal">PayPal</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Payment Status
              </label>
              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={changeField}
                className={inputClass}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-pink-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Order" : "Save Order"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-pink-200 bg-white px-5 py-2 text-sm font-medium text-[#831843] transition hover:bg-pink-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="animate-pulse rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-pink-100" />
          <div className="mt-4 h-10 rounded bg-pink-50" />
          <div className="mt-3 h-10 rounded bg-pink-50" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">No orders found</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Click &quot;+ Create Order&quot; above to create your first order.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
            <p className="text-sm font-semibold text-[#831843]">
              {orders.length} orders
            </p>
            <p className="text-xs text-[#9d6b82]">data/db/orders.json</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Order Number</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total & Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const avatar =
                    order.customer?.avatar ||
                    (order.customer?.name || "CU").slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-pink-100 odd:bg-pink-50/30 hover:bg-pink-50/70"
                    >
                      <td className="px-4 py-3 font-bold text-[#831843]">
                        {order.orderNumber}
                        <p className="text-[11px] font-normal text-[#9d6b82]">
                          {order.date
                            ? new Date(order.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-xs font-bold text-[#831843]">
                            {avatar}
                          </div>
                          <div>
                            <p className="font-medium text-[#831843]">
                              {order.customer?.name}
                            </p>
                            <p className="text-[11px] text-[#9d6b82]">
                              {order.customer?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-pink-100/70 px-2 py-0.5 text-xs font-semibold text-[#831843]">
                          {order.itemsCount || 1} items
                        </span>
                        <p className="mt-0.5 line-clamp-1 max-w-[180px] text-xs text-[#5b2b3d]">
                          {order.itemsSummary}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#831843]">
                         {formatPrice(order.totalAmount, currency)}
                        </p>
                        <p className="text-[11px] text-[#9d6b82]">
                          {order.paymentMethod} •{" "}
                          <span
                            className={
                              order.paymentStatus === "Paid"
                                ? "font-medium text-emerald-600"
                                : "font-medium text-amber-600"
                            }
                          >
                            {order.paymentStatus}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(order)}
                            className="rounded-lg border border-pink-200 px-3 py-1 text-xs font-medium text-[#831843] transition hover:bg-pink-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order)}
                            className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
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
    </section>
  );
}
