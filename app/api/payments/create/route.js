import { NextResponse, connection } from "next/server";
import { createPaymentIntent } from "@/lib/payments";

export async function POST(request) {
  await connection();

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || "").trim();

  if (!orderId) {
    return NextResponse.json(
      { error: "ORDER_ID_REQUIRED", message: "Order id is required." },
      { status: 400 }
    );
  }

  const result = await createPaymentIntent(orderId);

  if (result.error) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
}