import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readData, writeData } from "@/lib/db";

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

  const customers = await readData("customers");
  const index = customers.findIndex((item) => String(item.id) === String(id));

  if (index === -1) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const existing = customers[index];

  const firstname =
    body.firstname !== undefined
      ? body.firstname
      : body.name?.firstname !== undefined
      ? body.name.firstname
      : existing.name?.firstname;

  const lastname =
    body.lastname !== undefined
      ? body.lastname
      : body.name?.lastname !== undefined
      ? body.name.lastname
      : existing.name?.lastname;

  const city =
    body.city !== undefined
      ? body.city
      : body.address?.city !== undefined
      ? body.address.city
      : existing.address?.city;

  const street =
    body.street !== undefined
      ? body.street
      : body.address?.street !== undefined
      ? body.address.street
      : existing.address?.street;

  const zipcode =
    body.zipcode !== undefined
      ? body.zipcode
      : body.address?.zipcode !== undefined
      ? body.address.zipcode
      : existing.address?.zipcode;

  customers[index] = {
    ...existing,
    name: {
      firstname: String(firstname || "").trim(),
      lastname: String(lastname || "").trim(),
    },
    email: body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email,
    username: body.username !== undefined ? String(body.username).trim() : existing.username,
    phone: body.phone !== undefined ? String(body.phone).trim() : existing.phone,
    address: {
      ...existing.address,
      city: String(city || "").trim(),
      street: String(street || "").trim(),
      zipcode: String(zipcode || "").trim(),
    },
    status: body.status !== undefined ? body.status : existing.status,
    ordersCount: body.ordersCount !== undefined ? Number(body.ordersCount) : existing.ordersCount,
    totalSpent: body.totalSpent !== undefined ? Number(body.totalSpent) : existing.totalSpent,
  };

  await writeData("customers", customers);

  return NextResponse.json(customers[index]);
}

// DELETE /api/admin/customers/:id  → delete customer
export async function DELETE(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const customers = await readData("customers");
  const remaining = customers.filter((item) => String(item.id) !== String(id));

  if (remaining.length === customers.length) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await writeData("customers", remaining);

  return NextResponse.json({ ok: true });
}
