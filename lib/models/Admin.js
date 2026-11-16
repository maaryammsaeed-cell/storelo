import mongoose from "mongoose";
import { baseOptions } from "./base";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Admin" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },
    legacyId: { type: String },
  },
  baseOptions
);

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);