import Product from "@/lib/models/Product";

// Stock hold (kam karo). null = stock kaafi nahi → caller 409 de
export async function holdItem(productId, quantity, session) {
  return Product.findOneAndUpdate(
    { _id: productId, deletedAt: null, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { returnDocument: "after", session }
  ).lean();
}

// Stock wapas (fail / cancel / expire)
export async function releaseItem(productId, quantity, session) {
  return Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }, { session });
}