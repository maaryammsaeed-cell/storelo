import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getProduct, updateProduct, softDeleteProduct } from "@/lib/repo/products";
import { countOrdersUsingProduct } from "@/lib/repo/orders";

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

  // Sirf wahi fields patch mein jayenge jo request mein aaye hain
  const patch = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    patch.title = title;
  }

  // ---- Price validation ----
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be 0 or greater." },
        { status: 400 }
      );
    }
    patch.price = price;
  }

  // ---- Stock validation ----
  if (body.stock !== undefined) {
    const stock =
      body.stock === null || body.stock === "" ? null : Number(body.stock);

    if (stock !== null && (!Number.isFinite(stock) || stock < 0)) {
      return NextResponse.json(
        { error: "Stock must be 0 or greater." },
        { status: 400 }
      );
    }
    patch.stock = stock;
  }

  // ---- Status validation ----
  const allowedStatuses = ["active", "inactive", "discontinued", "preorder", "sale"];
  if (body.status !== undefined && allowedStatuses.includes(body.status)) {
    patch.status = body.status;
  }

  if (body.category !== undefined) patch.category = body.category;
  if (body.image !== undefined) {
    patch.image = body.image || "/images/products/tshirt.jpg";
  }
  if (body.allowBackorder !== undefined) {
    patch.allowBackorder = Boolean(body.allowBackorder);
  }
  if (body.preorderReleaseDate !== undefined) {
    patch.preorderReleaseDate = body.preorderReleaseDate || null;
  }
  if (body.description !== undefined) {
    patch.description = String(body.description).trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const updated = await updateProduct(id, patch);

  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/products/:id  → soft delete one product
export async function DELETE(request, ctx) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Soft-deleted product yahan nahi milega → 404
  const product = await getProduct(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // CHECK 1: kya ye product kisi order me hai?
  const usedInOrders = await countOrdersUsingProduct(id);

  if (usedInOrders > 0) {
    return NextResponse.json(
      {
        error: "PRODUCT_IN_USE",
        message: `Cannot delete product: It is associated with ${usedInOrders} existing order${
          usedInOrders === 1 ? "" : "s"
        }. Please mark the product as inactive or discontinued instead.`,
      },
      { status: 409 }
    );
  }

  // CHECK 2: kya stock abhi bhi bacha hai?
  const stock = Number(product.stock);

  if (Number.isFinite(stock) && stock > 0) {
    return NextResponse.json(
      {
        error: "STOCK_REMAINING",
        message: `Cannot delete product: There are still ${stock} unit${
          stock === 1 ? "" : "s"
        } in stock. Please adjust inventory to 0 before deleting.`,
      },
      { status: 409 }
    );
  }

  // DELETE: asal me delete nahi, sirf deletedAt laga rahe hain
  await softDeleteProduct(id);

  return NextResponse.json({ ok: true });
}