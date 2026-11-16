import { NextResponse, connection } from "next/server";
import { getPayment } from "@/lib/repo/payments";
import { getOrder } from "@/lib/repo/orders";
import { releaseExpiredPayments } from "@/lib/payments";

export async function GET(request, ctx) {
  await connection();

  const { id } = await ctx.params;
  await releaseExpiredPayments();

  const payment = await getPayment(id);

  if (!payment) {
    return NextResponse.json({ error: "PAYMENT_NOT_FOUND" }, { status: 404 });
  }

  const order = payment.orderId
    ? await getOrder(String(payment.orderId))
    : null;

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