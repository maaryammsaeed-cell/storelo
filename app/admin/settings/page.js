"use client";

import { useEffect, useState } from "react";

const CURRENCIES = ["USD", "PKR", "EUR", "GBP", "AED"];

const cardClass =
  "rounded-2xl border border-pink-100 bg-white p-5 shadow-sm sm:p-6";

const inputClass =
  "w-full rounded-xl border border-pink-100 bg-[#fdf2f8]/40 px-3 py-2.5 text-sm text-[#3f1d2e] outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100 disabled:opacity-60";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [store, setStore] = useState({
    storeName: "",
    logo: "",
    supportEmail: "",
    currency: "USD",
    lowStockLimit: "10",
    orderPrefix: "STL",
  });

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    orderNotifications: true,
  });

  // Hero aur footer ke text (landing page par dikhte hain)
  const [content, setContent] = useState({
    hero: {
      before: "",
      accent: "",
      after: "",
      text: "",
      buttonLabel: "",
      buttonHref: "",
    },
    footer: {
      heading: "",
      text: "",
      buttonLabel: "",
      buttonHref: "",
    },
  });

  const [profile, setProfile] = useState({ name: "", email: "" });

  const [savingStore, setSavingStore] = useState(false);
  const [storeMessage, setStoreMessage] = useState("");
  const [storeError, setStoreError] = useState("");

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState("");
  const [prefsError, setPrefsError] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [savingContent, setSavingContent] = useState(false);
  const [contentMessage, setContentMessage] = useState("");
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Settings load nahi hui");
        }

        if (!active) return;

        const settings = data.settings || {};

        setStore({
          storeName: settings.storeName || "Storelo",
          logo: settings.logo || "",
          supportEmail: settings.supportEmail || "",
          currency: settings.currency || "USD",
          lowStockLimit: String(settings.lowStockLimit ?? 10),
          orderPrefix: settings.orderPrefix || "STL",
        });

        setPrefs({
          emailNotifications: settings.emailNotifications !== false,
          orderNotifications: settings.orderNotifications !== false,
        });

        setProfile({
          name: data.admin?.name || "",
          email: data.admin?.email || "",
        });

        const hero = settings.hero || {};
        const footer = settings.footer || {};

        setContent({
          hero: {
            before: hero.before || "",
            accent: hero.accent || "",
            after: hero.after || "",
            text: hero.text || "",
            buttonLabel: hero.buttonLabel || "",
            buttonHref: hero.buttonHref || "",
          },
          footer: {
            heading: footer.heading || "",
            text: footer.text || "",
            buttonLabel: footer.buttonLabel || "",
            buttonHref: footer.buttonHref || "",
          },
        });

        setLoadError("");
      } catch (error) {
        if (active) {
          setLoadError(error.message || "Settings load nahi hui");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function saveSettings(payload, setSaving, setMessage, setError) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "The changes were not saved");
        return false;
      }

      setMessage("Saved successfully.");
      return true;
    } catch {
      setError("Network error. TRY AGAIN.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleStoreSubmit(event) {
    event.preventDefault();

    const lowStockLimit = Number(store.lowStockLimit);

    if (!store.storeName.trim()) {
      setStoreError("Enter your store name.");
      return;
    }

    if (!Number.isInteger(lowStockLimit) || lowStockLimit < 0) {
      setStoreError("Low stock limit poora number ho (0 ya zyada).");
      return;
    }

    await saveSettings(
      { ...store, lowStockLimit },
      setSavingStore,
      setStoreMessage,
      setStoreError
    );
  }
  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStoreError(data.error || "Logo upload nahi hua");
      return;
    }

    // Uploaded file ka path state me daal do — Save par DB me chala jayega
    setStore((current) => ({ ...current, logo: data.url }));
  }

  async function handlePrefsSubmit(event) {
      event.preventDefault();

      await saveSettings(prefs, setSavingPrefs, setPrefsMessage, setPrefsError);
    }

    async function handleProfileSubmit(event) {
      event.preventDefault();

      if (!profile.name.trim()) {
        setProfileError("Enter your store name.");
        return;
      }

      const ok = await saveSettings(
        { adminName: profile.name.trim() },
        setSavingProfile,
        setProfileMessage,
        setProfileError
      );

      if (ok) {
        setProfile((current) => ({ ...current, name: current.name.trim() }));
      }
    }

    async function handleContentSubmit(event) {
      event.preventDefault();

      await saveSettings(
        { hero: content.hero, footer: content.footer },
        setSavingContent,
        setContentMessage,
        setContentError
      );
    }

    // Ek hi field badalne ke liye chhota helper
    function updateContent(section, key, value) {
      setContent((current) => ({
        ...current,
        [section]: { ...current[section], [key]: value },
      }));
    }

    const initial = (profile.name || "A").trim().charAt(0).toUpperCase();

    return (
      <section className="min-w-0 flex-1">
        <header className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
            Workspace
          </p>
          <h1 className="font-playfair text-3xl text-[#831843] sm:text-4xl">
            Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#9d6b82]">
            Manage your store settings, stay updated with important alerts, and keep your profile information up to date.
          </p>
        </header>

        {loadError && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="h-80 animate-pulse rounded-2xl border border-pink-100 bg-white" />
            <div className="space-y-5">
              <div className="h-52 animate-pulse rounded-2xl border border-pink-100 bg-white" />
              <div className="h-52 animate-pulse rounded-2xl border border-pink-100 bg-white" />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* ---------------- Left ---------------- */}
            <div className="space-y-5">
            <form onSubmit={handleStoreSubmit} className={cardClass}>
              <SectionHeader
                icon={StoreIcon}
                title="Store details"
                subtitle="This information will be displayed on your storefront."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Store name">
                  <input
                    type="text"
                    value={store.storeName}
                    onChange={(event) =>
                      setStore((current) => ({
                        ...current,
                        storeName: event.target.value,
                      }))
                    }
                    placeholder="Storelo"
                    className={inputClass}
                  />
                </Field>

                <Field label="Support email">
                  <input
                    type="email"
                    value={store.supportEmail}
                    onChange={(event) =>
                      setStore((current) => ({
                        ...current,
                        supportEmail: event.target.value,
                      }))
                    }
                    placeholder="support@storelo.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="Store logo">
                  <div className="flex items-center gap-4">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt="Store logo"
                        className="h-14 w-14 rounded-xl object-cover ring-1 ring-pink-100"
                      />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-xl bg-pink-50 text-[10px] text-pink-400">
                        No logo
                      </span>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-sm"
                    />
                  </div>
                </Field>

                <Field label="Currency">
                  <select
                    value={store.currency}
                    onChange={(event) =>
                      setStore((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Low stock limit">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={store.lowStockLimit}
                    onChange={(event) =>
                      setStore((current) => ({
                        ...current,
                        lowStockLimit: event.target.value,
                      }))
                    }
                    placeholder="10"
                    className={inputClass}
                  />
                </Field>

                <Field label="Order prefix">
                  <input
                    type="text"
                    value={store.orderPrefix}
                    onChange={(event) =>
                      setStore((current) => ({
                        ...current,
                        orderPrefix: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="STL"
                    maxLength={5}
                    className={inputClass}
                  />
                </Field>
              </div>

              <FormFooter
                saving={savingStore}
                message={storeMessage}
                error={storeError}
                label="Save store details"
              />
            </form>

            {/* ---------- Hero + Footer text (landing page) ---------- */}
            <form onSubmit={handleContentSubmit} className={cardClass}>
              <SectionHeader
                icon={PencilIcon}
                title="Hero & footer text"
                subtitle="Landing page ka heading, paragraph aur button — Save karte hi site par badal jayega."
              />

              {/* Live preview */}
              <div className="mt-4 rounded-xl border border-dashed border-pink-200 bg-[#fdf2f8]/40 p-3 text-center">
                <p className="font-playfair text-lg text-[#1f2119]">
                  {content.hero.before}{" "}
                  <span className="italic text-[#b37b95]">{content.hero.accent}</span>{" "}
                  {content.hero.after}
                </p>
                <p className="mt-1 text-[11px] text-[#9d6b82]">
                  {content.hero.text}
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Field label="Hero — line 1">
                  <input
                    type="text"
                    value={content.hero.before}
                    onChange={(event) =>
                      updateContent("hero", "before", event.target.value)
                    }
                    placeholder="Style That Speaks,"
                    className={inputClass}
                  />
                </Field>

                <Field label="Hero — highlighted word">
                  <input
                    type="text"
                    value={content.hero.accent}
                    onChange={(event) =>
                      updateContent("hero", "accent", event.target.value)
                    }
                    placeholder="Elegance"
                    className={inputClass}
                  />
                </Field>

                <Field label="Hero — line 2">
                  <input
                    type="text"
                    value={content.hero.after}
                    onChange={(event) =>
                      updateContent("hero", "after", event.target.value)
                    }
                    placeholder="That Lasts."
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-4 space-y-4">
                <Field label="Hero — paragraph">
                  <textarea
                    rows={4}
                    value={content.hero.text}
                    onChange={(event) =>
                      updateContent("hero", "text", event.target.value)
                    }
                    placeholder="Discover the perfect blend of fashion and elegance..."
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Hero — button label">
                    <input
                      type="text"
                      value={content.hero.buttonLabel}
                      onChange={(event) =>
                        updateContent("hero", "buttonLabel", event.target.value)
                      }
                      placeholder="Shop Now"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Hero — button link">
                    <input
                      type="text"
                      value={content.hero.buttonHref}
                      onChange={(event) =>
                        updateContent("hero", "buttonHref", event.target.value)
                      }
                      placeholder="#products"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Footer — heading">
                  <input
                    type="text"
                    value={content.footer.heading}
                    onChange={(event) =>
                      updateContent("footer", "heading", event.target.value)
                    }
                    placeholder="Shop with Confidence"
                    className={inputClass}
                  />
                </Field>

                <Field label="Footer — paragraph">
                  <textarea
                    rows={3}
                    value={content.footer.text}
                    onChange={(event) =>
                      updateContent("footer", "text", event.target.value)
                    }
                    placeholder="Quality products, trusted service..."
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Footer — button label">
                    <input
                      type="text"
                      value={content.footer.buttonLabel}
                      onChange={(event) =>
                        updateContent("footer", "buttonLabel", event.target.value)
                      }
                      placeholder="Start Shopping"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Footer — button link">
                    <input
                      type="text"
                      value={content.footer.buttonHref}
                      onChange={(event) =>
                        updateContent("footer", "buttonHref", event.target.value)
                      }
                      placeholder="#products"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-pink-50/60 px-3 py-2 text-[11px] leading-5 text-[#9d6b82]">
                Koi box khali chhoren to wahan <strong>default text</strong> wapas
                aa jayega — site kabhi khali nahi dikhegi.
              </p>

              <FormFooter
                saving={savingContent}
                message={contentMessage}
                error={contentError}
                label="Save hero & footer"
              />
            </form>
            </div>

            {/* ---------------- Right ---------------- */}
            <aside className="space-y-5">
              {/* Profile */}
              <form onSubmit={handleProfileSubmit} className={cardClass}>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-200 to-[#e7b7c8] font-playfair text-xl font-bold text-[#831843]">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#831843]">
                      {profile.name || "Admin"}
                    </p>
                    <p className="truncate text-xs text-[#9d6b82]">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <Field label="Display name">
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Storelo Admin"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className={inputClass}
                    />
                  </Field>
                </div>

                <FormFooter
                  saving={savingProfile}
                  message={profileMessage}
                  error={profileError}
                  label="Save profile"
                />
              </form>

              {/* Preferences */}
              <form onSubmit={handlePrefsSubmit} className={cardClass}>
                <SectionHeader
                  icon={BellIcon}
                  title="Notifications"
                  subtitle="Choose which notifications you want to receive."
                />

                <div className="mt-4 space-y-3">
                  <ToggleRow
                    title="Email notifications"
                    hint="Naye orders ki email alerts"
                    checked={prefs.emailNotifications}
                    onChange={(value) =>
                      setPrefs((current) => ({
                        ...current,
                        emailNotifications: value,
                      }))
                    }
                  />

                  <ToggleRow
                    title="Order alerts"
                    hint="Receive notifications for every new order."
                    checked={prefs.orderNotifications}
                    onChange={(value) =>
                      setPrefs((current) => ({
                        ...current,
                        orderNotifications: value,
                      }))
                    }
                  />
                </div>

                <FormFooter
                  saving={savingPrefs}
                  message={prefsMessage}
                  error={prefsError}
                  label="Save preferences"
                />
              </form>

              {/* Summary */}
              <div className="rounded-2xl border border-[#f0e2d0] bg-gradient-to-b from-[#fdf6ec] to-white p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#831843]">
                  Quick summary
                </h2>

                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#9d6b82]">Store</dt>
                    <dd className="truncate font-semibold text-[#5b2b3d]">
                      {store.storeName || "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#9d6b82]">Currency</dt>
                    <dd className="font-semibold text-[#5b2b3d]">
                      {store.currency}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#9d6b82]">Order prefix</dt>
                    <dd className="font-semibold text-[#5b2b3d]">
                      {store.orderPrefix}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-[11px] leading-5 text-[#9d6b82] ring-1 ring-[#f0e2d0]">
                  These settings are saved in the MongoDB <strong>settings</strong> collection.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    );
  }

  /* ---------------- Helpers ---------------- */

  function Field({ label, children }) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#7c4a5e]">
          {label}
        </span>
        {children}
      </label>
    );
  }

  function SectionHeader({ icon: Icon, title, subtitle }) {
    return (
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-100 text-pink-600">
          <Icon />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#831843]">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-[#9d6b82]">{subtitle}</p>
        </div>
      </div>
    );
  }

  function FormFooter({ saving, message, error, label }) {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-pink-50 pt-4">
        <div className="min-w-0 text-xs">
          {error ? (
            <span className="text-rose-600">{error}</span>
          ) : message ? (
            <span className="text-emerald-600">{message}</span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#831843] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6b1236] disabled:opacity-60"
        >
          {saving ? "Saving..." : label}
        </button>
      </div>
    );
  }

  function ToggleRow({ title, hint, checked, onChange }) {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-pink-100 bg-white p-3">
        <span>
          <span className="block text-sm font-medium text-[#5b2b3d]">
            {title}
          </span>
          <span className="block text-xs text-[#9d6b82]">{hint}</span>
        </span>

        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 shrink-0 accent-[#831843]"
        />
      </label>
    );
  }

  /* ---------------- Icons ---------------- */

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

  function StoreIcon() {
    return (
      <IconBase>
        <path d="M3 9.5 4.5 4h15L21 9.5" />
        <path d="M4 9.5V20h16V9.5" />
        <path d="M9 20v-6h6v6" />
      </IconBase>
    );
  }

  function PencilIcon() {
    return (
      <IconBase>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </IconBase>
    );
  }

  function BellIcon() {
    return (
      <IconBase>
        <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
        <path d="M10.5 20a2 2 0 0 0 3 0" />
      </IconBase>
    );
  }