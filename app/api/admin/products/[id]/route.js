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

  products[index] = {
    ...products[index],
    title: body.title ?? products[index].title,
    price: body.price !== undefined ? Number(body.price) : products[index].price,
    category: body.category ?? products[index].category,
    image: body.image ?? products[index].image,
    stock: body.stock !== undefined ? Number(body.stock) : products[index].stock,
    status: body.status ?? products[index].status,
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