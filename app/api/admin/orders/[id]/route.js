import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readData, writeData } from "@/lib/db";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

// PATCH /api/admin/orders/:id  → update an existing order
export async function PATCH(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  const orders = await readData("orders");
  const index = orders.findIndex((item) => String(item.id) === String(id));

  if (index === -1) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const existing = orders[index];

  const customerName =
    body.customerName !== undefined
      ? body.customerName
      : body.customer?.name !== undefined
      ? body.customer.name
      : existing.customer?.name;

  const customerEmail =
    body.customerEmail !== undefined
      ? body.customerEmail
      : body.customer?.email !== undefined
      ? body.customer.email
      : existing.customer?.email;

  const avatar = customerName
    ? customerName
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : existing.customer?.avatar || "CU";

  orders[index] = {
    ...existing,
    orderNumber: body.orderNumber ?? existing.orderNumber,
    customer: {
      name: String(customerName || "").trim(),
      email: String(customerEmail || "").trim().toLowerCase(),
      avatar,
    },
    itemsCount: body.itemsCount !== undefined ? Number(body.itemsCount) : existing.itemsCount,
    itemsSummary: body.itemsSummary ?? existing.itemsSummary,
    totalAmount: body.totalAmount !== undefined ? Number(body.totalAmount) : existing.totalAmount,
    status: body.status ?? existing.status,
    paymentMethod: body.paymentMethod ?? existing.paymentMethod,
    paymentStatus: body.paymentStatus ?? existing.paymentStatus,
  };

  await writeData("orders", orders);

  return NextResponse.json(orders[index]);
}

// DELETE /api/admin/orders/:id  → remove an order
export async function DELETE(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const orders = await readData("orders");
  const remaining = orders.filter((item) => String(item.id) !== String(id));

  if (remaining.length === orders.length) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await writeData("orders", remaining);

  return NextResponse.json({ ok: true });
}
