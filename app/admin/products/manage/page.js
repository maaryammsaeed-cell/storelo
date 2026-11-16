"use client";

import { useCurrency } from "@/lib/useCurrency";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { formatPrice } from "@/lib/format";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  title: "",
  price: "",
  category: "",
  image: "/images/products/tshirt.jpg",
  stock: "",
  status: "active",
  allowBackorder: false,
  preorderReleaseDate: "",
  description: "",
};

const inputClass =
  "w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100";

// Table ke Status column ke liye label + colour
function getStatusBadge(status, stock, productAllowBackorder, storeAllowBackorder) {
  if (status === "discontinued") {
    return { label: "Discontinued", className: "bg-stone-200 text-stone-700" };
  }
  if (status === "preorder") {
    return { label: "Preorder", className: "bg-sky-50 text-sky-700" };
  }
  if (status === "inactive") {
    return { label: "Inactive (Temporarily Unavailable)", className: "bg-gray-100 text-gray-600" };
  }
  if (status === "sale") {
    return { label: "Sale", className: "bg-rose-50 text-rose-700 font-medium" };
  }
  if (
    Number(stock) === 0 &&
    productAllowBackorder === true &&
    storeAllowBackorder === true
  ) {
    return { label: "Backorder", className: "bg-amber-50 text-amber-700" };
  }
  // Agar stock 0 ho chuka hai:
  if (stock !== null && stock !== undefined && Number(stock) <= 0) {
    return { label: "Out of Stock", className: "bg-rose-50 text-rose-700" };
  }
  return { label: "Active", className: "bg-emerald-50 text-emerald-700" };
}

export default function ManageProductsPage() {

  const currency = useCurrency();
  // Store-wide backorder permission (Settings page se)
  const { allowBackorder: storeAllowBackorder } = useStoreSettings();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeProducts = products.filter((product) => !product.deletedAt);
  const deletedProducts = products.filter((product) => Boolean(product.deletedAt));

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ---------- READ ----------
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });

      if (res.status === 401) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load products. Please check the terminal for errors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Auto-dismiss error notification after 7 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 7000);
    return () => clearTimeout(timer);
  }, [error]);

  // Close delete modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && productToDelete && !deleting) {
        setProductToDelete(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productToDelete, deleting]);

  // ---------- FORM OPEN / CLOSE ----------

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl("");
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({
      title: product.title || "",
      price: product.price ?? "",
      category: product.category || "",
      image: product.image || "",
      stock: product.stock ?? "",
      status: product.status || "active",
      allowBackorder: product.allowBackorder === true,
      preorderReleaseDate: product.preorderReleaseDate || "",
      description: product.description || "",   // ← naya
    });
    setSelectedFile(null);
    setPreviewUrl(product.image || "");
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setSelectedFile(null);
    setPreviewUrl("");
    setFormError("");
  }

  function changeField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }
  // ---------- CREATE + UPDATE ----------
  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setFormError("Price must be 0 or greater.");
      return;
    }

    if (form.stock !== "") {
      const stockValue = Number(form.stock);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        setFormError("Stock must be 0 or greater.");
        return;
      }
    }

    if (form.status === "preorder" && !form.preorderReleaseDate) {
      setFormError("A release date is required for preorder products.");
      return;
    }

    const wasEditing = Boolean(editingId);
    setSaving(true);

    try {
      const url = wasEditing
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";
      let finalImage = form.image || "/images/products/tshirt.jpg";

      // Agar computer se nayi picture select ki hai toh pehle upload karo
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadDataJson = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadDataJson.error || "Image upload failed.");
        }
        finalImage = uploadDataJson.url;
      }

      const res = await fetch(url, {
        method: wasEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          price: Number(form.price),
          category: form.category.trim() || "General",
          image: finalImage,
          stock: form.stock === "" ? null : Number(form.stock),
          status: form.status,
          description: form.description.trim(),
          // Store-wide OFF ho to per-product backorder save hi na ho
          allowBackorder: storeAllowBackorder && form.allowBackorder === true,
          preorderReleaseDate: form.preorderReleaseDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unable to save.");

      await loadProducts();
      closeForm();
      setMessage(
        wasEditing
          ? "Product details have been updated successfully."
          : "New product has been added to your catalog."
      );
    } catch (err) {
      setFormError(err.message || "Unable to save product details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- DELETE CONFIRMATION & EXECUTION ----------
  function openDeleteModal(product) {
    setProductToDelete(product);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setProductToDelete(null);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || "Unable to delete product. Please try again.");
        setProductToDelete(null);
        return;
      }

      await loadProducts();
      setMessage(`Product "${productToDelete.title}" has been deleted successfully.`);
      setProductToDelete(null);
    } catch {
      setError("An unexpected error occurred while deleting the product. Please try again.");
      setProductToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore(product) {
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}/restore`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || "Unable to restore product. Please try again.");
        return;
      }

      await loadProducts();
      setMessage(`Product "${product.title}" has been restored successfully as inactive.`);
    } catch {
      setError("An unexpected error occurred while restoring the product. Please try again.");
    }
  }

  return (
    <section className="min-w-0 flex-1">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Manage Mode
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Manage Products
          </h1>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Add, edit, and delete records easily, with all changes securely saved to your database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products"
            className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#831843] shadow-sm transition hover:bg-pink-50"
          >
            View Products
          </Link>
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-xl bg-[#b37b95] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            + Add Product
          </button>
        </div>
      </header>

      {/* Notifications */}
      {message && (
        <div
          role="status"
          className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-emerald-900">Success</p>
              <p className="mt-0.5 text-emerald-800">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100 transition"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-rose-900">Notice</p>
              <p className="mt-0.5 text-rose-800">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-rose-600 hover:bg-rose-100 transition"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 font-playfair text-xl text-[#831843]">
            {editingId ? "Edit Product" : "New Product"}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={changeField}
                placeholder="Hoodie"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={changeField}
                rows={4}
                placeholder="Product ki tafseel likhein..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Price *
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={changeField}
                placeholder="125"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Category
              </label>
              <input
                name="category"
                value={form.category}
                onChange={changeField}
                placeholder="Men / Women"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Stock
              </label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={changeField}
                placeholder="10"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Product Image *
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {previewUrl ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-pink-200 bg-pink-50 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-pink-700">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {selectedFile ? (
                  <span className="text-xs font-medium text-emerald-700">
                    ✓ {selectedFile.name}
                  </span>
                ) : (
                  <span className="text-xs text-[#9d6b82]">
                    No image file chosen
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-[#9d6b82]">
                Select a product image from your computer. Once saved, it will be displayed on the landing page.
              </p>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive (Temporarily Unavailable)</option>
                <option value="discontinued">Discontinued</option>
                <option value="preorder">Preorder</option>
                <option value="sale">Sale</option>

              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                Allow Backorder
              </label>
              <label
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${storeAllowBackorder
                  ? "border-pink-100 bg-white text-[#3f1d2e]"
                  : "cursor-not-allowed border-pink-100/60 bg-stone-50 text-[#9d6b82]"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={storeAllowBackorder && form.allowBackorder}
                  disabled={!storeAllowBackorder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      allowBackorder: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-pink-600 disabled:cursor-not-allowed"
                />
                Allow orders when stock reaches 0.
              </label>
              <p className="mt-1 text-[11px] text-[#9d6b82]">
                {storeAllowBackorder
                  ? "This product can accept backorders when stock reaches 0."
                  : "Enable backorders in Settings first to use this option."}
              </p>
            </div>

            {form.status === "preorder" ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#7c4a5e]">
                  Preorder Release Date *
                </label>
                <input
                  name="preorderReleaseDate"
                  type="date"
                  value={form.preorderReleaseDate}
                  onChange={changeField}
                  className={inputClass}
                />
              </div>
            ) : null}
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
              {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
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

      {/* List */}
      {loading ? (
        <div className="animate-pulse rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-pink-100" />
          <div className="mt-4 h-10 rounded bg-pink-50" />
          <div className="mt-3 h-10 rounded bg-pink-50" />
        </div>
      ) : activeProducts.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">No products found</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            Click &quot;Add Product&quot; to create your first product.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
            <p className="text-sm font-semibold text-[#831843]">
              {activeProducts.length} products
            </p>
            <p className="text-xs text-[#9d6b82]">data/db/products.json</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeProducts.map((product) => {
                  const badge = getStatusBadge(product.status, product.stock, product.allowBackorder,
                    storeAllowBackorder);
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-pink-100 odd:bg-pink-50/30 hover:bg-pink-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-pink-100 bg-white p-1">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-full w-full object-contain"
                              onError={(event) => {
                                event.currentTarget.src = "/images/products/tshirt.jpg";
                              }}
                            />
                          </div>
                          <span className="font-medium text-[#831843]">
                            {product.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#5b2b3d]">
                        {product.category || "General"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#831843]">
                        {formatPrice(product.price, currency)}
                      </td>
                      <td className="px-4 py-3 text-[#5b2b3d]">
                        {Number(product.stock || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            className="rounded-lg border border-pink-200 px-3 py-1 text-xs font-medium text-[#831843] transition hover:bg-pink-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(product)}
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

      {/* Deleted Products (Restore) */}
      {deletedProducts.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="border-b border-pink-100 px-4 py-3">
            <p className="text-sm font-semibold text-[#831843]">
              Deleted Products ({deletedProducts.length})
            </p>
          </div>

          <table className="w-full text-left text-sm">
            <tbody>
              {deletedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-pink-100 last:border-b-0 hover:bg-pink-50/40 transition"
                >
                  <td className="px-4 py-3 font-medium text-[#831843]">
                    {product.title}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#9d6b82]">
                    {product.deletedAt ? new Date(product.deletedAt).toLocaleString() : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRestore(product)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={closeDeleteModal}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-pink-100">
            {/* Top Bar with Icon and Close Button */}
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition disabled:opacity-50"
                aria-label="Close dialog"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Title & Description */}
            <div className="mt-4">
              <h3
                id="delete-dialog-title"
                className="font-playfair text-xl font-bold text-[#831843]"
              >
                Delete Product
              </h3>
              <p className="mt-1 text-sm text-[#7c4a5e]">
                Are you sure you want to delete this product? This action will remove the product from your store catalog.
              </p>
            </div>

            {/* Product Summary Card */}
            <div className="mt-4 rounded-xl border border-pink-100 bg-[#fdf8fa] p-3.5">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-pink-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productToDelete.image || "/images/products/tshirt.jpg"}
                    alt={productToDelete.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/products/tshirt.jpg";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-[#831843]">
                    {productToDelete.title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#9d6b82]">
                    <span className="capitalize">{productToDelete.category || "General"}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#831843]">
                      {formatPrice(productToDelete.price, currency)}
                    </span>
                    <span>•</span>
                    <span>
                      Stock:{" "}
                      <strong className={Number(productToDelete.stock) > 0 ? "text-amber-700 font-semibold" : "text-stone-600"}>
                        {Number(productToDelete.stock || 0)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {Number(productToDelete.stock) > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200/60">
                  <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    Note: Products with remaining inventory ({productToDelete.stock} unit{Number(productToDelete.stock) === 1 ? "" : "s"}) or active orders cannot be deleted until inventory is cleared.
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium text-[#7c4a5e] transition hover:bg-pink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}