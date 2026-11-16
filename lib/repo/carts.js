import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Cart from "@/lib/models/Cart";
import { toDTO } from "./serialize";

// Purani cookie mein UUID hoti hai → null (naya cart banega)
export async function getCart(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Cart.findById(id).lean());
}

export async function getOrCreateCart(id) {
  await connectDB();
  if (mongoose.isValidObjectId(id)) {
    const existing = await Cart.findById(id).lean();
    if (existing) return toDTO(existing);
  }
  return toDTO((await Cart.create({ items: [] })).toObject());
}

// Item pehle se hai to quantity barhao (atomic positional update)
export async function addItem(cartId, productId, quantity) {
  await connectDB();
  const bumped = await Cart.findOneAndUpdate(
    { _id: cartId, "items.productId": productId },
    { $inc: { "items.$.quantity": quantity } },
    { returnDocument: "after" }
  ).lean();
  if (bumped) return toDTO(bumped);

  return toDTO(
    await Cart.findByIdAndUpdate(
      cartId,
      { $push: { items: { productId, quantity } } },
      { returnDocument: "after" }
    ).lean()
  );
}

export async function setItemQuantity(cartId, productId, quantity) {
  await connectDB();
  if (quantity <= 0) return removeItem(cartId, productId);

  return toDTO(
    await Cart.findOneAndUpdate(
      { _id: cartId, "items.productId": productId },
      { $set: { "items.$.quantity": quantity } },
      { returnDocument: "after" }
    ).lean()
  );
}

export async function removeItem(cartId, productId) {
  await connectDB();
  return toDTO(
    await Cart.findByIdAndUpdate(
      cartId,
      { $pull: { items: { productId } } },
      { returnDocument: "after" }
    ).lean()
  );
}

export async function clearCart(cartId) {
  await connectDB();
  return toDTO(
    await Cart.findByIdAndUpdate(
      cartId,
      { $set: { items: [] } },
      { returnDocument: "after" }
    ).lean()
  );
}

export async function setReservation(cartId, reservation) {
  await connectDB();
  return Cart.updateOne({ _id: cartId }, { $set: { reservation } });
}

export async function clearReservation(cartId) {
  await connectDB();
  return Cart.updateOne({ _id: cartId }, { $unset: { reservation: "" } });
}

export async function listExpiredReservations() {
  await connectDB();
  const docs = await Cart.find({
    "reservation.expiresAt": { $lt: new Date() },
  }).lean();
  return docs.map((d) => ({ id: String(d._id), reservation: d.reservation }));
}