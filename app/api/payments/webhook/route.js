import { NextResponse, connection } from "next/server";
import crypto from "crypto";
import { applyPaymentEvent } from "@/lib/payments";

const SECRET =
  process.env.PAYMENT_WEBHOOK_SECRET || "storelo-dev-secret";

function verifySignature(rawBody, signature) {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  await connection();

  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "INVALID_SIGNATURE" },
      { status: 401 }
    );
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!event?.id || !event?.type || !event?.paymentId) {
    return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
  }

  const result = await applyPaymentEvent(event);

  if (result.error) {
    return NextResponse.json(result, {
      status: result.error === "PAYMENT_NOT_FOUND" ? 404 : 400,
    });
  }

  return NextResponse.json(result);
}