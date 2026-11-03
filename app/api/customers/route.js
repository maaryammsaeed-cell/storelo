import { NextResponse, connection } from "next/server";
import { readData } from "@/lib/db";

export async function GET() {
  await connection();

  const customers = await readData("customers");
  return NextResponse.json(customers);
}
