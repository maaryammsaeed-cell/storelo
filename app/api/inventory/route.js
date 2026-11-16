import { NextResponse, connection } from "next/server";
import { listProducts } from "@/lib/repo/products";
 
export async function GET() {
  
  
  await connection();
  
  const products = await listProducts();
  
  

  return NextResponse.json(
    products.map((product) => ({
      ...product,
      rating: product.rating || { rate: 4.5, count: 20 },
    }))
  );
}