import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";

// Ye product kitne orders mein use hua hai? (delete se pehle check)
export async function countOrdersUsingProduct(productId) {
  await connectDB();
  return Order.countDocuments({ "items.productId": productId });
}

export async function listOrders() {
  await connectDB();
  return toDTOs(await Order.find({}).sort({ _id: -1 }).lean());
}

export async function getOrder(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Order.findById(id).lean());
}

export async function getOrderByCheckoutKey(key) {
  await connectDB();
  return toDTO(await Order.findOne({ checkoutKey: key }).lean());
}

export async function createOrder(data) {
  await connectDB();
  return toDTO((await Order.create(data)).toObject());
}

export async function updateOrder(id, patch) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(
    await Order.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: "after", runValidators: true }).lean()
  );
}

export async function deleteOrder(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Order.findByIdAndDelete(id).lean());
}