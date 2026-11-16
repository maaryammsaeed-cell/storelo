import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import {
  deleteCustomer,
  getCustomer,
  getCustomerByEmail,
  updateCustomer,
} from "@/lib/repo/customers";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

// PATCH /api/admin/customers/:id  → update customer
export async function PATCH(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  const existing = await getCustomer(id);
  if (!existing) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const patch = {};

  const firstname = body.firstname ?? body.name?.firstname;
  const lastname = body.lastname ?? body.name?.lastname;
  if (firstname !== undefined || lastname !== undefined) {
    patch.name = {
      firstname: String(firstname ?? existing.name?.firstname ?? "").trim(),
      lastname: String(lastname ?? existing.name?.lastname ?? "").trim(),
    };
  }

  const city = body.city ?? body.address?.city;
  const street = body.street ?? body.address?.street;
  const zipcode = body.zipcode ?? body.address?.zipcode;
  if (city !== undefined || street !== undefined || zipcode !== undefined) {
    patch.address = {
      ...existing.address,
      city: String(city ?? existing.address?.city ?? "").trim(),
      street: String(street ?? existing.address?.street ?? "").trim(),
      zipcode: String(zipcode ?? existing.address?.zipcode ?? "").trim(),
    };
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    const duplicate = await getCustomerByEmail(email);
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json(
        { error: "A customer with this email already exists." },
        { status: 409 }
      );
    }
    patch.email = email;
  }

  if (body.username !== undefined) patch.username = String(body.username).trim();
  if (body.phone !== undefined) patch.phone = String(body.phone).trim();
  if (body.status !== undefined) patch.status = body.status;
  if (body.ordersCount !== undefined) patch.ordersCount = Number(body.ordersCount);
  if (body.totalSpent !== undefined) patch.totalSpent = Number(body.totalSpent);

  const updated = await updateCustomer(id, patch);
  return NextResponse.json(updated);
}

// DELETE /api/admin/customers/:id  → delete customer
export async function DELETE(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const removed = await deleteCustomer(id);
  if (!removed) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}