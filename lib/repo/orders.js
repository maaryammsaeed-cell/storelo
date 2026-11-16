import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";

// Ye product kitne orders mein use hua hai? (delete se pehle check)
export async function countOrdersUsingProduct(productId) {
  await connectDB();
  return Order.countDocuments({ "items.productId": productId });
}