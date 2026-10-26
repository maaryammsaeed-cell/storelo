import { NextResponse, connection } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { demoProducts } from "@/data/products";
import { getDemoStoreData } from "@/lib/demo-api";

export async function GET() {
  await connection();

  // 1. Try to fetch from MongoDB if available
  try {
    await connectDB();
    const dbProducts = await Product.find({}).lean();
    if (dbProducts && dbProducts.length > 0) {
      const normalized = dbProducts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        price: p.price,
        description: p.description || `${p.category || "Store"} collection item`,
        category: p.category || "General",
        image: p.image,
        rating: {
          rate: typeof p.rating === "number" ? p.rating : (p.rating?.rate ?? 4.5),
          count: p.reviews ?? (p.rating?.count ?? 20),
        },
      }));
      return NextResponse.json(normalized);
    }
  } catch {
    // If MongoDB is offline, gracefully continue to fallback options
  }

  // 2. Try fetching from the DummyJSON demo API
  try {
    const { products } = await getDemoStoreData();

    if (products.length > 0) {
      return NextResponse.json(products);
    }
  } catch {
    // Demo API failed or timed out
  }

  // 3. Guaranteed Fallback to local demo products
  const fallback = demoProducts.map((p) => ({
    id: p._id || p.id,
    title: p.title,
    price: p.price,
    description: `Premium ${p.category} product from Storelo inventory.`,
    category: p.category || "General",
    image: p.image,
    rating: {
      rate: typeof p.rating === "number" ? p.rating : 4.5,
      count: p.reviews || 25,
    },
  }));

  return NextResponse.json(fallback);
}
