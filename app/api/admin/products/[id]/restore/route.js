import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readData, writeData } from "@/lib/db";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const products = await readData("products");
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!products[index].deletedAt) {
    return NextResponse.json(
      { error: "This product is not deleted or is already active." },
      { status: 409 }
    );
  }

  // Restore: deletedAt hatao, status inactive rakho
  products[index] = {
    ...products[index],
    deletedAt: null,
    status: "inactive",
  };

  await writeData("products", products);

  return NextResponse.json({ ok: true, product: products[index] });
}