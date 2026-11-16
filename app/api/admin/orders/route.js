import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createOrder, listOrders } from "@/lib/repo/orders";

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

  const orders = await listOrders();
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

  const avatar =
    customerName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CU";

  try {
    const newOrder = await createOrder({
      // checkoutKey unique index hai — admin order ke liye bhi zaroori
      checkoutKey: "admin_" + crypto.randomUUID(),
      orderNumber:
        body.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
      date: body.date || new Date(),
      customer: {
        name: customerName,
        email: customerEmail,
        avatar,
      },
      itemsCount: Number(body.itemsCount || 1),
      itemsSummary: itemsSummary || "Standard Store Item",
      totalAmount: Number(body.totalAmount || 0),
      status: body.status || "Processing",
      paymentMethod: body.paymentMethod || "Credit Card",
      paymentStatus: body.paymentStatus || "Paid",
      items: [],
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Order number already exists. Please try again." },
        { status: 409 }
      );
    }
    throw error;
  }
}