import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createProduct, listProducts } from "@/lib/repo/products";
import { getProduct, updateProduct, softDeleteProduct } from "@/lib/repo/products";
import { countOrdersUsingProduct } from "@/lib/repo/orders";
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

  const products = await listProducts({ includeDeleted: true });
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

  // ---- Stock validation ----
  const rawStock = body.stock;
  const stock =
    rawStock === undefined || rawStock === null || rawStock === ""
      ? null
      : Number(rawStock);

  if (stock !== null && (!Number.isFinite(stock) || stock < 0)) {
    return NextResponse.json(
      { error: "Stock must be 0 or greater." },
      { status: 400 }
    );
  }


  const allowedStatuses = ["active", "inactive", "discontinued", "preorder","sale"];
  const status = allowedStatuses.includes(body.status)
    ? body.status
    : "active";

  const newProduct = await createProduct({
    title: String(body.title).trim(),
    price: Number(body.price),
    category: body.category || "General",
    image: body.image || "/images/products/tshirt.jpg",
    stock,
    status,
    description: String(body.description || "").trim(),
    allowBackorder: body.allowBackorder === true,
    preorderReleaseDate:
      status === "preorder" ? body.preorderReleaseDate || null : null,
  });

  return NextResponse.json(newProduct, { status: 201 });
}