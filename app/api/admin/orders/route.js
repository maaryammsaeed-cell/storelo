import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readData, writeData } from "@/lib/db";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

// GET /api/admin/orders  → read all orders
export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await readData("orders");
  return NextResponse.json(orders);
}

// POST /api/admin/orders  → create a new order
export async function POST(request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const customerName = String(body.customerName || body.customer?.name || "").trim();
  const customerEmail = String(body.customerEmail || body.customer?.email || "").trim().toLowerCase();
  const itemsSummary = String(body.itemsSummary || "").trim();

  if (!customerName || !customerEmail) {
    return NextResponse.json(
      { error: "Customer name and email are required" },
      { status: 400 }
    );
  }

  const orders = await readData("orders");

  const avatar = customerName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CU";

  const newOrder = {
    id: crypto.randomUUID(),
    orderNumber: body.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    date: body.date || new Date().toISOString(),
    customer: {
      name: customerName,
      email: customerEmail,
      avatar,
    },
    itemsCount: Number(body.itemsCount || 1),
    itemsSummary: itemsSummary || "Standard Store Item",
    totalAmount: Number(body.totalAmount || 0),
    status: body.status || "Processing", // "Processing", "Shipped", "Delivered", "Cancelled"
    paymentMethod: body.paymentMethod || "Credit Card",
    paymentStatus: body.paymentStatus || "Paid", // "Paid", "Pending", "Refunded"
  };

  orders.unshift(newOrder);
  await writeData("orders", orders);

  return NextResponse.json(newOrder, { status: 201 });
}
