import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { releaseExpiredReservations, reserveCart } from "@/lib/reserve";

export async function POST(request) {
  await connection();

  const body = await request.json().catch(() => null);
  const selectedProductIds = Array.isArray(body?.selectedProductIds)
    ? body.selectedProductIds.map(String)
    : null;

  const cartId = (await cookies()).get("cart_id")?.value;

  if (!cartId) {
    return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
  }

  await releaseExpiredReservations();

  const result = await reserveCart(cartId, selectedProductIds);

  if (result.error) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.error === "CART_EMPTY" ? 400 : 409 }
    );
  }

  return NextResponse.json({ expiresAt: result.expiresAt });
}