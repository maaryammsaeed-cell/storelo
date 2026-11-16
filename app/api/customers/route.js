import { NextResponse, connection } from "next/server";
import { listCustomers } from "@/lib/repo/customers";

export async function GET() {
  await connection();

  const customers = await listCustomers();
  return NextResponse.json(customers);
}
