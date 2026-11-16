import { NextResponse, connection } from "next/server";
import { listProducts } from "@/lib/repo/products";

export async function GET() {
  await connection();
  const products = await listProducts();

  return NextResponse.json(products);
}