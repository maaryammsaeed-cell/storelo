import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Product from "@/lib/models/Product";
import { toDTO, toDTOs } from "./serialize";

export async function listProducts({ category, search, includeDeleted = false } = {}) {
  await connectDB();
  const filter = {};
  if (!includeDeleted) filter.deletedAt = null;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const docs = await Product.find(filter).sort({ _id : -1 }).lean();
  return toDTOs(docs);
}

export async function getProduct(id) {
  await connectDB();
    if (!mongoose.isValidObjectId(id)) return null; 
  return toDTO(await Product.findOne({ _id: id, deletedAt: null }).lean());
  
}
    
// Deleted products bhi dhoondta hai (restore ke liye zaroori)
export async function getProductIncludingDeleted(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return toDTO(await Product.findById(id).lean());
}

// Soft delete undo: deletedAt hatao, status inactive
export async function restoreProduct(id) {
  await connectDB();
  return toDTO(
    await Product.findOneAndUpdate(
      { _id: id },
      { $set: { deletedAt: null, status: "inactive" } },
      { returnDocument: "after" }
    ).lean()
  );
}

export async function createProduct(data) {
  await connectDB();
  return toDTO((await Product.create(data)).toObject());
}

export async function updateProduct(id, data) {
  await connectDB();
   if (!mongoose.isValidObjectId(id)) return null; 
  return toDTO(
    await Product.findOneAndUpdate({ _id: id }, { $set: data }, { returnDocument: "after" }).lean()
  );
}

export async function softDeleteProduct(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;   // ← add
  return toDTO(
    await Product.findOneAndUpdate({ _id: id }, { $set: { deletedAt: new Date() } }, { returnDocument: "after" }).lean()
  );
}
export async function listProductsByIds(ids) {
  await connectDB();
  const valid = (ids || []).filter((id) => mongoose.isValidObjectId(id));
  const docs = await Product.find({ _id: { $in: valid }, deletedAt: null }).lean();
  return toDTOs(docs);
}