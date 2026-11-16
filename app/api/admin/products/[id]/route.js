import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readData, writeData } from "@/lib/db";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

// PATCH /api/admin/products/:id  → update one product
export async function PATCH(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In Next.js 16, params is a Promise.
  const { id } = await ctx.params;
  const body = await request.json();

  const products = await readData("products");
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // ---- Price validation ----
  let price = products[index].price;
  if (body.price !== undefined) {
    price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be 0 or greater." },
        { status: 400 }
      );
    }
  }

  // ---- Stock validation ----
  let stock = products[index].stock;
  if (body.stock !== undefined) {
    stock =
      body.stock === null || body.stock === ""
        ? null
        : Number(body.stock);

    if (stock !== null && (!Number.isFinite(stock) || stock < 0)) {
      return NextResponse.json(
        { error: "Stock must be 0 or greater." },
        { status: 400 }
      );
    }
  }

  // ---- Status validation ----
  const allowedStatuses = ["active", "inactive", "discontinued", "preorder"];
  const status =
    body.status !== undefined
      ? allowedStatuses.includes(body.status)
        ? body.status
        : products[index].status
      : products[index].status;

  products[index] = {
    ...products[index],
    title: body.title ?? products[index].title,
    price,
    category: body.category ?? products[index].category,
    image: body.image ?? products[index].image,
    stock,
    status,
    allowBackorder:
      body.allowBackorder !== undefined
        ? Boolean(body.allowBackorder)
        : products[index].allowBackorder === true,
    preorderReleaseDate:
      body.preorderReleaseDate !== undefined
        ? body.preorderReleaseDate || null
        : products[index].preorderReleaseDate ?? null,
        description:
    body.description !== undefined
      ? String(body.description).trim()
      : products[index].description ?? "",   // ← naya
  };

  await writeData("products", products);

  return NextResponse.json(products[index]);
}

// DELETE /api/admin/products/:id  → remove one product
export async function DELETE(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const products = await readData("products");
  const remaining = products.filter((item) => item.id !== id);

  if (remaining.length === products.length) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await writeData("products", remaining);

  return NextResponse.json({ ok: true });
}