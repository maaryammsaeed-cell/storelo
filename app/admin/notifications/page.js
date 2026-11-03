"use client";

import { useEffect, useMemo, useState } from "react";

const READ_STORAGE_KEY = "storelo_read_notifications";

function loadReadIds() {
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReadIds(ids) {
  try {
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage band ho to ignore
  }
}

function getEmojiIcon(type) {
  if (type === "order") return "🛍️";
  if (type === "customer") return "👤";
  if (type === "stock") return "⚠️";
  return "🔔";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load notifications");
        }

        const data = await response.json();
        const readIds = new Set(loadReadIds());
        const list = Array.isArray(data) ? data : [];

        if (active) {
          setNotifications(
            list.map((item) => ({ ...item, read: readIds.has(item.id) }))
          );
          setError("");
        }
      } catch {
        if (active) {
          setError(
            "Notifications load nahi hui. Internet check karke dobara try karein."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  function refresh() {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  }

  function markAsRead(id) {
    const ids = new Set(loadReadIds());
    ids.add(id);
    saveReadIds(ids);

    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }

  function markAllAsRead() {
    const ids = new Set(loadReadIds());
    notifications.forEach((item) => ids.add(item.id));
    saveReadIds(ids);

    setNotifications((items) =>
      items.map((item) => ({ ...item, read: true }))
    );
  }

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => !item.read);
    if (filter === "order")
      return notifications.filter((item) => item.type === "order");
    if (filter === "stock")
      return notifications.filter((item) => item.type === "stock");
    if (filter === "customer")
      return notifications.filter((item) => item.type === "customer");
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="mx-auto max-w-6xl p-6 font-sans md:p-10">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-6 rounded-2xl border border-pink-100 bg-white/60 p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-center">
        <div>
          <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pink-600">
            Store Activity & Center
          </span>

          <h1 className="mt-2 flex flex-wrap items-center gap-3 font-serif text-3xl font-bold text-pink-950 md:text-4xl">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-pink-600 px-3 py-1 font-sans text-xs font-medium text-white shadow-sm">
                {unreadCount} Unread
              </span>
            )}
          </h1>

          <p className="mt-1 max-w-xl text-sm text-pink-900/70">
            Live store activity — naye orders, customers aur low stock alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-50 disabled:opacity-50"
          >
            <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-pink-700"
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-3">
        {[
          { id: "all", label: "All Notifications", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
          {
            id: "order",
            label: "Orders",
            count: notifications.filter((item) => item.type === "order").length,
          },
          {
            id: "stock",
            label: "Stock Alerts",
            count: notifications.filter((item) => item.type === "stock").length,
          },
          {
            id: "customer",
            label: "Customers",
            count: notifications.filter((item) => item.type === "customer")
              .length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
              filter === tab.id
                ? "border-pink-950 bg-pink-950 text-white shadow-sm"
                : "border-pink-100 bg-white/80 text-pink-950/80 hover:bg-pink-50"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                filter === tab.id
                  ? "bg-pink-800 text-white"
                  : "bg-pink-100 text-pink-800"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3.5">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-pink-100 bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white/50 p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-2xl text-pink-600 shadow-inner">
            ✨
          </div>
          <h3 className="font-serif text-xl font-bold text-pink-950">
            No Notifications Found
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-pink-900/60">
            Is filter mein koi update nahi hai. Aap bilkul up to date hain!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex flex-col justify-between gap-4 rounded-2xl border p-4.5 transition-all sm:flex-row sm:items-center ${
                notif.read
                  ? "border-pink-100/60 bg-amber-50/20 opacity-85 hover:opacity-100"
                  : "border-pink-200 bg-white shadow-md shadow-pink-950/5"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl ${
                    notif.read
                      ? "border-stone-200 bg-stone-50"
                      : "border-pink-200 bg-pink-50 shadow-sm"
                  }`}
                >
                  {getEmojiIcon(notif.type)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4
                      className={`text-sm font-bold ${
                        notif.read ? "text-stone-700" : "text-pink-950"
                      }`}
                    >
                      {notif.title}
                    </h4>

                    {!notif.read && (
                      <span className="rounded-full border border-pink-200 bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    {notif.message}
                  </p>

                  <span className="mt-1.5 block text-[11px] font-medium text-pink-900/50">
                    🕒 {notif.time}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(notif.id)}
                  className="self-end whitespace-nowrap rounded-xl border border-pink-200 bg-pink-50 px-3.5 py-2 text-xs font-semibold text-pink-700 transition-all hover:bg-pink-600 hover:text-white sm:self-center"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}