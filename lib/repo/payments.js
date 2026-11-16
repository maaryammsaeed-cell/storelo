import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Payment from "@/lib/models/Payment";
import { toDTO, toDTOs } from "./serialize";

export async function listPayments() {
  await connectDB();
  return toDTOs(await Payment.find({}).sort({ _id: -1 }).lean());
}

export async function getPayment(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Payment.findById(id).lean());
}

// payment._id ya providerPaymentId — dono se dhoondo (mock/webhook)
export async function findPaymentByAnyId(value) {
  await connectDB();
  if (mongoose.isValidObjectId(value)) {
    const byId = await Payment.findById(value).lean();
    if (byId) return toDTO(byId);
  }
  return toDTO(
    await Payment.findOne({ providerPaymentId: String(value) }).lean()
  );
}

export async function getPaymentsByOrder(orderId) {
  await connectDB();
  if (!mongoose.isValidObjectId(orderId)) return [];
  return toDTOs(await Payment.find({ orderId }).lean());
}