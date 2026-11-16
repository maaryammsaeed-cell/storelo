import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Customer from "@/lib/models/Customer";
import { toDTO, toDTOs } from "./serialize";

export async function listCustomers() {
  await connectDB();
  const docs = await Customer.find({}).sort({ _id: 1 }).lean();
  return toDTOs(docs);
}

export async function getCustomer(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Customer.findById(id).lean());
}

export async function getCustomerByEmail(email) {
  await connectDB();
  return toDTO(
    await Customer.findOne({ email: String(email).toLowerCase().trim() }).lean()
  );
}

export async function createCustomer(data) {
  await connectDB();
  return toDTO((await Customer.create(data)).toObject());
}

export async function updateCustomer(id, data) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(
    await Customer.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: "after", runValidators: true }
    ).lean()
  );
}

export async function deleteCustomer(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Customer.findByIdAndDelete(id).lean());
}

// Checkout ke waqt: orders count + total spent barhao
export async function incrementCustomerStats(id, { amount = 0, phone = "" } = {}) {
  await connectDB();
  const set = phone ? { phone } : {};
  return Customer.updateOne(
    { _id: id },
    { $inc: { ordersCount: 1, totalSpent: amount }, $set: set }
  );
}