import { NextResponse, connection } from "next/server";
import { readData } from "@/lib/db";

export async function GET() {
  await connection();

  const products = await readData("products");

  return NextResponse.json(
    products.map((product) => ({
      ...product,
      rating: product.rating || { rate: 4.5, count: 20 },
    }))
  );
}