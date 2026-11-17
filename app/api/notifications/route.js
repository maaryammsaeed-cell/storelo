import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { listProducts } from "@/lib/repo/products";
import { listOrders } from "@/lib/repo/orders";
import { listCustomers } from "@/lib/repo/customers";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

function timeAgo(dateValue) {
  const diff = Date.now() - new Date(dateValue).getTime();
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

  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  const lowStockLimit = Number(settings?.lowStockLimit ?? 10);
  const currency = settings?.currency || "USD";

  try {
    const [products, orders, customers] = await Promise.all([
      listProducts(),
      listOrders(),
      listCustomers(),
    ]);

    const notifications = [];

    // ---------- 1. Low / out of stock ----------
    products
      .filter(
        (product) =>
          product.stock !== null &&
          product.stock !== undefined &&
          Number(product.stock) <= lowStockLimit
      )
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 6)
      .forEach((product) => {
        const stock = Number(product.stock);

        notifications.push({
          id: `stock-${product.id}`,
          type: "stock",
          title: stock <= 0 ? "Out of Stock" : "Low Stock Alert",
          message:
            stock <= 0
              ? `"${product.title}" is out of stock. Please restock it soon.`
              : `"${product.title}" has only ${stock} item${
                  stock > 1 ? "s" : ""
                } remaining in stock.`,
          createdAt: product.updatedAt || product.createdAt,
        });
      });

    // ---------- 2. Recent orders ----------
    orders.slice(0, 6).forEach((order) => {
      notifications.push({
        id: `order-${order.id}`,
        type: "order",
        title: "New Order Received",
        message: `Order #${order.orderNumber} placed by ${
          order.customer?.name || "Customer"
        } for ${formatPrice(order.totalAmount, currency)}.`,
        createdAt: order.date || order.createdAt,
      });
    });

    // ---------- 3. New customers ----------
    [...customers]
      .sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate))
      .slice(0, 4)
      .forEach((customer) => {
        const name =
          `${customer.name?.firstname || ""} ${
            customer.name?.lastname || ""
          }`.trim() || customer.email;

        notifications.push({
          id: `customer-${customer.id}`,
          type: "customer",
          title: "New Customer Registered",
          message: `${name} created a new account.`,
          createdAt: customer.joinedDate,
        });
      });

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