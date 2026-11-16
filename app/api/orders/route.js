import { NextResponse, connection } from "next/server";
import {listOrders } from  "@/lib/repo/orders";

export async function GET() {
  await connection();

  const orders = await listOrders();
  return NextResponse.json(orders);
}
