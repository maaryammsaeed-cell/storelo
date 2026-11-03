"use client";

import { useCurrency } from "@/lib/useCurrency";
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
};

const inputClass =
  "w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100";

export default function ManageProductsPage() {

  const currency = useCurrency(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- READ ----------
  const loadProducts = useCallback(async () => {
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
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError("Products load nahi ho sake. Terminal mein error check karo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  // Message 3 second baad khud gayab
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

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
      setFormError("Title zaroori hai.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setFormError("Price 0 ya us se zyada hona chahiye.");
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
              throw new Error(uploadDataJson.error || "Image upload fail hui");
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
          stock: Number(form.stock || 0),
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Save nahi hua");

      await loadProducts();
      closeForm();
      setMessage(wasEditing ? "Product update ho gaya ✅" : "Naya product add ho gaya ✅");
    } catch (err) {
      setFormError(err.message || "Save nahi hua. Dobara try karo.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- DELETE ----------
  async function handleDelete(product) {
    const ok = window.confirm(
      `Delete "${product.title}"? Ye wapas nahi aayega.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      await loadProducts();
      setMessage("Product delete ho gaya 🗑️");
    } catch {
      setError("Product delete nahi hua. Dobara try karo.");
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
                Apne computer se product ki photo select karein. Save karne par landing page par show hogi.
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
                <option value="inactive">Inactive</option>
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
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-[#831843]">Koi product nahi</p>
          <p className="mt-1 text-sm text-[#9d6b82]">
            &quot;Add Product&quot; dabao aur pehla product banao.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
            <p className="text-sm font-semibold text-[#831843]">
              {products.length} products
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
                {products.map((product) => (
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
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status === "active" ? "Active" : "Inactive"}
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
                          onClick={() => handleDelete(product)}
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}