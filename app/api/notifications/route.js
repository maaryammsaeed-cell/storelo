import { NextResponse, connection } from "next/server";
import { getDemoStoreData } from "@/lib/demo-api";

import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";

const LOW_STOCK_LIMIT = 10;

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();

  if (Number.isNaN(diff) || diff < 0) return "Just now";

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export async function GET() {
  await connection();

  const settings = await getSettings();   // 👈 NAYA

  try {
    const { products, carts, users } = await getDemoStoreData();
    const now = Date.now();
    const notifications = [];

    // ---------- 1. Low / out of stock alerts ----------
    const lowStock = [...products]
      .filter((product) => product.stock <= LOW_STOCK_LIMIT)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);

    lowStock.forEach((product, index) => {
      notifications.push({
        id: `stock-${product.id}`,
        type: "stock",
        title: product.stock === 0 ? "Out of Stock" : "Low Stock Alert",
        message:
          product.stock === 0
            ? `"${product.title}" is out of stock. Restock it soon.`
            : `"${product.title}" has only ${product.stock} item${product.stock > 1 ? "s" : ""
            } left in stock.`,
        createdAt: new Date(now - (index + 1) * 45 * 60 * 1000).toISOString(),
      });
    });

    // ---------- 2. Recent orders ----------
    carts.slice(0, 6).forEach((cart, index) => {
      const user =
        users.find((item) => item.id === cart.userId) ||
        users[index % users.length];

      const name = user?.name
        ? `${user.name.firstname} ${user.name.lastname}`
        : `Customer #${cart.userId}`;

      const total = (cart.products || []).reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 45 * item.quantity);
      }, 0);

      notifications.push({
        id: `order-${cart.id}`,
        type: "order",
        title: "New Order Received",
        message: `Order #ORD-${9100 + cart.id} placed by ${name} for ${formatPrice(
          total, settings?.currency || "USD"
        )}.`,
        createdAt:
          cart.date ||
          new Date(now - index * 6 * 60 * 60 * 1000).toISOString(),
      });
    });

    // ---------- 3. New customers ----------
    users.slice(0, 4).forEach((user, index) => {
      const name = `${user.name.firstname} ${user.name.lastname}`;

      notifications.push({
        id: `customer-${user.id}`,
        type: "customer",
        title: "New Customer Registered",
        message: `${name} created a new account.`,
        createdAt: new Date(now - (index + 1) * 3 * 60 * 60 * 1000).toISOString(),
      });
    });

    // ---------- Newest first ----------
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      notifications.slice(0, 18).map((item) => ({
        ...item,
        time: timeAgo(item.createdAt),
      }))
    );
  } catch (error) {
    console.error("Notifications API error:", error?.message);

    return NextResponse.json(
      { error: "Unable to load notifications" },
      { status: 502 }
    );
  }
}