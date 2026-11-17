import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createCustomer, listCustomers } from "@/lib/repo/customers";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

// GET /api/admin/customers  → get all customers
export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

 const customers = await listCustomers();
  return NextResponse.json(customers);
}

// POST /api/admin/customers  → create a new customer
export async function POST(request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const firstname = String(body.firstname || body.name?.firstname || "").trim();
  const lastname = String(body.lastname || body.name?.lastname || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!firstname || !email) {
    return NextResponse.json(
      { error: "First name and email are required" },
      { status: 400 }
    );
  }

 

 const newCustomer = await createCustomer({
    name: { firstname, lastname: lastname || "" },
    email,
    username: body.username ? String(body.username).trim() : email.split("@")[0],
    phone: body.phone ? String(body.phone).trim() : "",
    address: {
      city: body.city ? String(body.city).trim() : body.address?.city || "",
      street: body.street ? String(body.street).trim() : body.address?.street || "",
      number: body.number || body.address?.number || "",
      zipcode: body.zipcode ? String(body.zipcode).trim() : body.address?.zipcode || "",
    },
    status: body.status || "Active",
    ordersCount: Number(body.ordersCount || 0),
    totalSpent: Number(body.totalSpent || 0),
    joinedDate: body.joinedDate || new Date(),
  });

  return NextResponse.json(newCustomer, { status: 201 });
}
