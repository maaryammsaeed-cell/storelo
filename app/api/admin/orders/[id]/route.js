import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { deleteOrder, getOrder, updateOrder } from "@/lib/repo/orders";

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

  const existing = await getOrder(id);
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const patch = {};

  if (body.orderNumber !== undefined) patch.orderNumber = String(body.orderNumber).trim();
  if (body.itemsCount !== undefined) patch.itemsCount = Number(body.itemsCount);
  if (body.itemsSummary !== undefined) patch.itemsSummary = String(body.itemsSummary);
  if (body.totalAmount !== undefined) patch.totalAmount = Number(body.totalAmount);
  if (body.status !== undefined) patch.status = body.status;
  if (body.paymentMethod !== undefined) patch.paymentMethod = body.paymentMethod;
  if (body.paymentStatus !== undefined) patch.paymentStatus = body.paymentStatus;

  // customer nested object hai — merge karo, replace nahi
  const name = body.customerName ?? body.customer?.name;
  const email = body.customerEmail ?? body.customer?.email;

  if (name !== undefined || email !== undefined) {
    const finalName = String(name ?? existing.customer?.name ?? "").trim();

    const avatar =
      body.customer?.avatar ??
      (finalName
        ? finalName
            .split(" ")
            .filter(Boolean)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : existing.customer?.avatar || "CU");

    patch.customer = {
      ...existing.customer,
      name: finalName,
      email: String(email ?? existing.customer?.email ?? "").trim().toLowerCase(),
      avatar,
    };
  }

  const updated = await updateOrder(id, patch);
  return NextResponse.json(updated);
}

// DELETE /api/admin/orders/:id  → remove an order
export async function DELETE(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const removed = await deleteOrder(id);
  if (!removed) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}