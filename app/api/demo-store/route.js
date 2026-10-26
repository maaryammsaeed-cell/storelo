import { NextResponse, connection } from "next/server";
import { getDemoStoreData } from "@/lib/demo-api";

export async function GET() {
  await connection();

  try {
    const { products, carts, users } = await getDemoStoreData();

    const totalRevenue = carts.reduce((total, cart) => {
      const cartTotal = cart.products.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);

      return total + cartTotal;
    }, 0);

    return NextResponse.json({
      products,
      carts,
      users,
      stats: {
        totalProducts: products.length,
        totalOrders: carts.length,
        totalCustomers: users.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Demo API error:", error?.message);

    return NextResponse.json(
      { error: "Unable to load API data" },
      { status: 502 }
    );
  }
}
