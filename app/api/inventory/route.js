import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { listProducts } from "@/lib/repo/products";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET() {
  await connection();

  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await listProducts();

  return NextResponse.json(
    products.map((product) => ({
      ...product,
      rating: product.rating || { rate: 4.5, count: 20 },
    }))
  );
}
