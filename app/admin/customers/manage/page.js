"use client";

import { useCurrency } from "@/lib/useCurrency";
import { formatPrice } from "@/lib/format";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  city: "",
  street: "",
  zipcode: "",
  status: "Active",
  ordersCount: "0",
  totalSpent: "0",
};

const inputClass =
  "w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100";

export default function ManageCustomersPage() {

  const currency = useCurrency();   // 👈 pehli line
  const [customers, setCustomers] = useState([]);
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
  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Unable to load customers. Please check server logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mount par ek dafa data load karna maqsad hai. Ye rule "await" ke baad wala
    // setState pehchan nahi pata, is liye sirf isi call par rule band hai.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomers();
  }, [loadCustomers]);

  // Auto clear message after 3 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // ---------- FORM OPEN / CLOSE ----------
  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(cust) {
    setEditingId(cust.id);
    setForm({
      firstname: cust.name?.firstname || "",
      lastname: cust.name?.lastname || "",
      email: cust.email || "",
      phone: cust.phone || "",
      city: cust.address?.city || "",
      street: cust.address?.street || "",
      zipcode: cust.address?.zipcode || "",
      status: cust.status || "Active",
      ordersCount: String(cust.ordersCount ?? 0),
      totalSpent: String(cust.totalSpent ?? 0),
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

    if (!form.firstname.trim()) {
      setFormError("First name is required.");
      return;
    }

    if (!form.email.trim()) {
      setFormError("Email is required.");
      return;
    }

    const wasEditing = Boolean(editingId);
    setSaving(true);

    try {
      const url = wasEditing
        ? `/api/admin/customers/${editingId}`
        : "/api/admin/customers";

      const res = await fetch(url, {
        method: wasEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          street: form.street.trim(),
          zipcode: form.zipcode.trim(),
          status: form.status,
          ordersCount: Number(form.ordersCount || 0),
          totalSpent: Number(form.totalSpent || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Save failed");

      await loadCustomers();
      closeForm();
      setMessage(wasEditing ? "Customer updated successfully ✅" : "New customer added successfully ✅");
    } catch (err) {
      setFormError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- DELETE ----------
  async function handleDelete(cust) {
    const fullName = `${cust.name?.firstname || ""} ${cust.name?.lastname || ""}`.trim() || cust.email;
    const ok = window.confirm(
      `Delete customer "${fullName}"? This action cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/customers/${cust.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      await loadCustomers();
      setMessage("Customer deleted successfully 🗑️");
    } catch {
      setError("Customer could not be deleted. Please try again.");
    }
  }

  return (
    <section className="min-w-0 flex-1">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Customer Management
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Manage Customers
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Create, update, and manage customer accounts directly in your database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/customers"
            className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50"
          >
            View Directory
          </Link>
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            + Add Customer
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
            {editingId ? "Edit Customer Details" : "New Customer"}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                First Name *
              </label>
              <input
                name="firstname"
                value={form.firstname}
                onChange={changeField}
                placeholder="Sophia"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Last Name
              </label>
              <input
                name="lastname"
                value={form.lastname}
                onChange={changeField}
                placeholder="Anderson"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Email Address *
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={changeField}
                placeholder="sophia@example.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={changeField}
                placeholder="+1 (555) 234-8901"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                City
              </label>
              <input
                name="city"
                value={form.city}
                onChange={changeField}
                placeholder="New York"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Street Address
              </label>
              <input
                name="street"
                value={form.street}
                onChange={changeField}
                placeholder="452 5th Ave"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Postal / Zipcode
              </label>
              <input
                name="zipcode"
                value={form.zipcode}
                onChange={changeField}
                placeholder="10018"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={changeField}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="VIP">VIP</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Total Orders Count
              </label>
              <input
                name="ordersCount"
                type="number"
                min="0"
                value={form.ordersCount}
                onChange={changeField}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Total Spent ($)
              </label>
              <input
                name="totalSpent"
                type="number"
                min="0"
                step="0.01"
                value={form.totalSpent}
                onChange={changeField}
                placeholder="0.00"
                className={inputClass}
              />
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
              {saving ? "Saving..." : editingId ? "Update Customer" : "Save Customer"}
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

      {/* Customer List */}
      {loading ? (
        <div className="animate-pulse rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-pink-100" />
          <div className="mt-4 h-10 rounded bg-pink-50" />
          <div className="mt-3 h-10 rounded bg-pink-50" />
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">No customers found</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Click &quot;+ Add Customer&quot; above to create your first customer.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
            <p className="text-sm font-semibold text-[#831843]">
              {customers.length} registered customers
            </p>
            <p className="text-xs text-[#9d6b82]">data/db/customers.json</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Orders & Spend</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => {
                  const firstName = cust.name?.firstname || "User";
                  const lastName = cust.name?.lastname || "";
                  const fullName = `${firstName} ${lastName}`.trim();
                  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "CU";

                  return (
                    <tr
                      key={cust.id}
                      className="border-b border-pink-100 odd:bg-pink-50/30 hover:bg-pink-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 font-bold text-[#831843]">
                            {initials}
                          </div>
                          <div>
                            <span className="font-medium text-[#831843]">
                              {fullName}
                            </span>
                            <p className="text-xs text-[#9d6b82]">@{cust.username || "user"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-[#3f1d2e]">{cust.email}</p>
                        <p className="text-[11px] text-[#9d6b82]">{cust.phone || "No phone"}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#5b2b3d]">
                        <p className="text-xs font-medium">{cust.address?.city || "Unknown"}</p>
                        <p className="text-[11px] text-[#9d6b82]">{cust.address?.street || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-pink-100/70 px-2 py-0.5 text-xs font-bold text-[#831843]">
                            {cust.ordersCount || 0} orders
                          </span>
                          <span className="text-xs font-semibold text-[#831843]">
                            {formatPrice(cust.totalSpent || 0, currency)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cust.status === "VIP"
                              ? "bg-purple-100 text-purple-800"
                              : cust.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cust.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(cust)}
                            className="rounded-lg border border-pink-200 px-3 py-1 text-xs font-medium text-[#831843] transition hover:bg-pink-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cust)}
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
