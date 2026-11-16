import { NextResponse, connection } from "next/server";
import { readData } from "@/lib/db";
import { releaseExpiredPayments } from "@/lib/payments";

export async function GET(request, ctx) {
  await connection();

  const { id } = await ctx.params;
    await releaseExpiredPayments();

  const [payments, orders] = await Promise.all([
    readData("payments"),
    readData("orders"),
  ]);

  const payment = payments.find((p) => p.id === id);

  if (!payment) {
    return NextResponse.json(
      { error: "PAYMENT_NOT_FOUND" },
      { status: 404 }
    );
  }

  const order = orders.find((o) => o.id === payment.orderId);

  return NextResponse.json({
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    expiresAt: payment.expiresAt,
    order: order
      ? {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          stockState: order.stockState,
        }
      : null,
  });
}