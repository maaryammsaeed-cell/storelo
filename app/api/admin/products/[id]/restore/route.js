import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getProductIncludingDeleted, restoreProduct } from "@/lib/repo/products";

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

  const existing = await getProductIncludingDeleted(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!existing.deletedAt) {
    return NextResponse.json(
      { error: "This product is not deleted or is already active." },
      { status: 409 }
    );
  }

  const product = await restoreProduct(id);

  return NextResponse.json({ ok: true, product });
}