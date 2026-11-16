import { NextResponse, connection } from "next/server";
import { findPaymentByAnyId } from "@/lib/repo/payments";
import { applyPaymentEvent } from "@/lib/payments";

const OUTCOMES = {
  success: "payment.succeeded",
  fail: "payment.failed",
  cancel: "payment.cancelled",
  pending: "payment.pending",
};

export async function POST(request) {
  await connection();

  // Sirf development mein
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const paymentId = String(body?.paymentId || "").trim();
  const outcome = String(body?.outcome || "").trim();

  if (!paymentId) {
    return NextResponse.json(
      { error: "PAYMENT_ID_REQUIRED" },
      { status: 400 }
    );
  }

  // Duplicate test: pichla event dobara bhejo
  if (outcome === "duplicate") {
 const payment = await findPaymentByAnyId(paymentId);

    const last = payment?.events?.[payment.events.length - 1];

    if (!last) {
      return NextResponse.json(
        {
          error: "NO_PREVIOUS_EVENT",
          message: "Pehle koi event bhejo.",
        },
        { status: 400 }
      );
    }

    const result = await applyPaymentEvent({
      id: last.id,
      type: last.type,
      paymentId: payment.id,
    });

    return NextResponse.json(result);
  }

  const type = OUTCOMES[outcome];

  if (!type) {
    return NextResponse.json(
      {
        error: "INVALID_OUTCOME",
        allowed: [...Object.keys(OUTCOMES), "duplicate"],
      },
      { status: 400 }
    );
  }

  const result = await applyPaymentEvent({
    id: "evt_" + crypto.randomUUID(),
    type,
    paymentId,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}