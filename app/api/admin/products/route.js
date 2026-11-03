import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readData, writeData } from "@/lib/db";

// Only a logged-in admin can use these routes.
async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

// GET /api/admin/products  → read all products
export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await readData("products");
  return NextResponse.json(products);
}

// POST /api/admin/products  → add a new product
export async function POST(request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || body.price === undefined || body.price === "") {
    return NextResponse.json(
      { error: "Title and price are required" },
      { status: 400 }
    );
  }

  const products = await readData("products");

  const newProduct = {
    id: crypto.randomUUID(),
    title: String(body.title).trim(),
    price: Number(body.price),
    category: body.category || "General",
    image: body.image || "/images/products/tshirt.jpg",
    stock: Number(body.stock || 0),
    status: body.status === "inactive" ? "inactive" : "active",
  };

  products.push(newProduct);
  await writeData("products", products);

  return NextResponse.json(newProduct, { status: 201 });
}