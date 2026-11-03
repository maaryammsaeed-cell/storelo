import { NextResponse, connection } from "next/server";
import { readData } from "@/lib/db";

export async function GET() {
  await connection();

  const orders = await readData("orders");
  return NextResponse.json(orders);
}
