import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

import { connection } from "next/server";
import { getDemoStoreData } from "@/lib/demo-api";
import RevenueTrendChart from "@/components/admin/charts/RevenueTrendChart";
import CategoryDonutChart from "@/components/admin/charts/CategoryDonutChart";
import CategoryBarChart from "@/components/admin/charts/CategoryBarChart";

import { getSettings } from "@/lib/settings";   // 👈 NAYA
import { formatPrice } from "@/lib/format";     // 👈 NAYA

async function getStoreData() {
  try {
    return await getDemoStoreData();
  } catch (error) {
    console.error("Dashboard data error:", error);
    return null;
  }
}
// Logged-in admin ka asli naam/email database se laata hai
async function getAdminProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session) return { name: "Admin", email: "" };

    await connectDB();
    const doc = await Admin.findById(session.sub).select("name email").lean();

    return {
      name: doc?.name || "Admin",
      email: doc?.email || session.email || "",
    };
  } catch {
    return { name: "Admin", email: "" };
  }
}
function formatCurrency(value , currency) {
  return formatPrice(value, currency);
}


function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name) {
  return String(name || "Customer")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AdminPage() {
  // Next ko batata hai ke ye page har request par fresh render ho.
  await connection();
  const adminProfile = await getAdminProfile();   // 👈 NAYA
  const data = await getStoreData();


// 👇 NAYA
const settings = await getSettings();
const currency = settings.currency;

  const products = data?.products || [];
  const carts = data?.carts || [];
  const users = data?.users || [];

  const totalRevenue = carts.reduce((total, cart) => {
    const cartTotal = (cart.products || []).reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    return total + cartTotal;
  }, 0);

  const averageOrder = carts.length ? totalRevenue / carts.length : 0;

  const revenueByCategory = Object.entries(
    carts.reduce((acc, cart) => {
      (cart.products || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;

        const category = product.category || "Other";
        acc[category] = (acc[category] || 0) + product.price * item.quantity;
      });

      return acc;
    }, {})
  )
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const categoryCounts = Object.entries(
    products.reduce((acc, product) => {
      const category = product.category || "Other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ---------- Revenue trend (last 14 days) ----------
  const trendDays = 14;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const trendBuckets = Array.from({ length: trendDays }, (_, index) => {
    const date = new Date(todayStart);
    date.setDate(date.getDate() - (trendDays - 1 - index));

    return {
      key: toDayKey(date),
      day: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: 0,
    };
  });

  const trendMap = new Map(trendBuckets.map((item) => [item.key, item]));

  carts.forEach((cart) => {
    const bucket = trendMap.get(toDayKey(new Date(cart.date)));
    if (!bucket) return;

    const cartTotal = (cart.products || []).reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    bucket.revenue += cartTotal;
  });

  const revenueTrendData = trendBuckets.map((item) => ({
    day: item.day,
    revenue: Number(item.revenue.toFixed(2)),
  }));

  const recentOrders = [...carts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((cart) => {
      const user = users.find((u) => u.id === cart.userId);

      const customerName = user
        ? `${user.name.firstname} ${user.name.lastname}`
        : `Customer #${cart.userId}`;

      const total = (cart.products || []).reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);

      const items = (cart.products || []).reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      return {
        id: cart.id,
        customerName,
        initials: getInitials(customerName),
        date: formatDate(cart.date),
        items,
        total,
      };
    });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = [
    {
      title: "Total Products",
      value: products.length,
      description: "Items in your catalog",
      icon: BoxIcon,
      iconClass: "bg-pink-100 text-pink-600",
      glow: "bg-pink-200",
    },
    {
      title: "Total Orders",
      value: carts.length,
      description: "Demo orders placed",
      icon: ReceiptIcon,
      iconClass: "bg-rose-100 text-rose-600",
      glow: "bg-rose-200",
    },
    {
      title: "Total Customers",
      value: users.length,
      description: "Registered customers",
      icon: UsersIcon,
      iconClass: "bg-fuchsia-100 text-fuchsia-600",
      glow: "bg-fuchsia-200",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue ,currency),
      description: `Avg. order ${formatCurrency(averageOrder , currency)}`,
      icon: DollarIcon,
      iconClass: "bg-amber-100 text-amber-600",
      glow: "bg-amber-200",
    },
  ];

  return (
    <section className="min-w-0 flex-1">
      {/* ---------- Header banner ---------- */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Store Overview
            </span>

            <h1 className="mt-4 font-playfair text-3xl leading-tight text-[#831843] sm:text-4xl">
              Welcome back, {adminProfile.name}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#9d6b82]">
              Here&apos;s a quick look at your store today — products, orders,
              customers, and revenue at a glance.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#7c4a5e] shadow-sm ring-1 ring-pink-100">
                {today}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                Live demo data
              </span>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm backdrop-blur sm:w-auto sm:pr-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-sm font-bold text-white">
              {getInitials(adminProfile.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#831843]">
                {adminProfile.name}
              </p>
              <p className="truncate text-xs text-[#9d6b82]">
                {adminProfile.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      {!data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">We couldn&apos;t load your store data.</p>
          <p className="mt-1 text-red-600">
            Please check your internet connection and refresh the page.
          </p>
        </div>
      ) : (
        <>
          {/* ---------- Summary cards ---------- */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.title}
                  className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100"
                >
                  <div
                    className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60 ${stat.glow}`}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9d6b82]">
                      {stat.title}
                    </p>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${stat.iconClass}`}
                    >
                      <Icon />
                    </span>
                  </div>

                  <p className="relative mt-3 break-words text-2xl font-bold text-[#831843] sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="relative mt-1 text-xs text-[#9d6b82]">
                    {stat.description}
                  </p>
                </article>
              );
            })}
          </div>

          {/* ---------- Revenue trend ---------- */}
          <section className="mb-6 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#831843]">
                  Revenue Trend
                </h2>
                <p className="mt-1 text-sm text-[#9d6b82]">
                  Last 14 days of demo orders.
                </p>
              </div>
              <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-100">
                {formatCurrency(
                  revenueTrendData.reduce((sum, item) => sum + item.revenue, 0) , currency
                )}
              </span>
            </div>

            <div className="mt-4">
              <RevenueTrendChart data={revenueTrendData} currency={currency} />
            </div>
          </section>

          {/* ---------- Category charts ---------- */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#831843]">
                    Revenue by Category
                  </h2>
                  <p className="mt-1 text-sm text-[#9d6b82]">
                    Calculated from all demo orders.
                  </p>
                </div>
                <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-100">
                  {revenueByCategory.length} categories
                </span>
              </div>

              {revenueByCategory.length === 0 ? (
                <p className="mt-5 text-sm text-[#9d6b82]">
                  No sales data available.
                </p>
              ) : (
                <div className="mt-4">
                  <CategoryDonutChart
                    data={revenueByCategory} 
                    total={totalRevenue}
                    currency={currency}
                  />
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#831843]">
                    Products by Category
                  </h2>
                  <p className="mt-1 text-sm text-[#9d6b82]">
                    How your catalog is distributed.
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                  {products.length} items
                </span>
              </div>

              {categoryCounts.length === 0 ? (
                <p className="mt-5 text-sm text-[#9d6b82]">
                  No products available.
                </p>
              ) : (
                <div className="mt-4">
                  <CategoryBarChart data={categoryCounts} />
                </div>
              )}
            </section>
          </div>

          {/* ---------- Recent orders ---------- */}
          <section className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-[#831843]">
                  Recent Orders
                </h2>
                <p className="mt-1 text-sm text-[#9d6b82]">
                  Latest 5 orders from the demo API.
                </p>
              </div>
              <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-100">
                {recentOrders.length} shown
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-[#9d6b82]">No orders available.</p>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <ul className="divide-y divide-pink-100 sm:hidden">
                  {recentOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-100 text-[11px] font-bold text-pink-700">
                          {order.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#5b2b3d]">
                            {order.customerName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#9d6b82]">
                            #{order.id} · {order.date} · {order.items} items
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#831843]">
                        {formatCurrency(order.total , currency)}
                      </p>
                    </li>
                  ))}
                </ul>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                      <tr>
                        {["Order", "Customer", "Date", "Items", "Total"].map(
                          (heading) => (
                            <th key={heading} className="px-5 py-3 font-medium">
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-pink-50 transition last:border-0 hover:bg-pink-50/60"
                        >
                          <td className="px-5 py-3 font-medium text-[#5b2b3d]">
                            #{order.id}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-100 text-[10px] font-bold text-pink-700">
                                {order.initials}
                              </span>
                              <span className="text-[#5b2b3d]">
                                {order.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-[#7c4a5e]">
                            {order.date}
                          </td>
                          <td className="px-5 py-3 text-[#7c4a5e]">
                            {order.items}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 font-semibold text-[#831843]">
                            {formatCurrency(order.total , currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}

      <footer className="mt-8 border-t border-pink-100 pt-5 text-center">
        <p className="text-sm font-medium text-[#831843]">
          Storelo — Simplifying Your Store Management
        </p>
        <p className="mt-1 text-xs text-[#9d6b82]">
          Demo dashboard powered by DummyJSON API
        </p>
      </footer>
    </section>
  );
}

/* ---------- Inline icons (no extra package) ---------- */

function IconBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
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

function ReceiptIcon() {
  return (
    <IconBase>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </IconBase>
  );
}

function UsersIcon() {
  return (
    <IconBase>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 20a5.5 5.5 0 0 1 5.5-5" />
    </IconBase>
  );
}

function DollarIcon() {
  return (
    <IconBase>
      <path d="M12 2v20" />
      <path d="M17 6.5c0-1.9-2.2-3.5-5-3.5S7 4.6 7 6.5 9.2 10 12 10s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
    </IconBase>
  );
}