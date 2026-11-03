import { NextResponse, connection } from "next/server";
import { readData } from "@/lib/db";

export async function GET() {
  await connection();

  const products = await readData("products");
  return NextResponse.json(products);
}