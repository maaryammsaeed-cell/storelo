import { NextResponse, connection } from "next/server";
import { releaseExpiredPayments } from "@/lib/payments";

export async function POST() {
  await connection();

  const result = await releaseExpiredPayments();

  return NextResponse.json(result);
}