import mongoose from "mongoose";
import { baseOptions } from "./base";

// Sub-documents ko alag schema rakho, _id: false zaroori hai
const nameSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    street: { type: String, default: "" },
    number: { type: String, default: "" },
    zipcode: { type: String, default: "" },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    legacyId: { type: String },

    name: { type: nameSchema, default: () => ({}) },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: addressSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["Active", "VIP", "Inactive"],
      default: "Active",
    },

    // derived (orders se calculate) — drift ka risk, M5 mein discuss karenge
    ordersCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },

    joinedDate: { type: Date, default: Date.now },
  },
  baseOptions
);

customerSchema.index({ legacyId: 1 }, { unique: true, sparse: true });
customerSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);