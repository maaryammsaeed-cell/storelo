import mongoose from "mongoose";
import { baseOptions } from "./base";

const productSchema = new mongoose.Schema(
  {
    legacyId: { type: String }, // purana JSON id

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: null, min: 0 },
    image: { type: String, required: true },
    category: { type: String, default: "" },

    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },

    stock: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued", "preorder", "sale"],
      default: "active",
    },
    allowBackorder: { type: Boolean, default: false },
    preorderReleaseDate: { type: Date, default: null },
    showInCollections: { type: Boolean, default: true },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },

    deletedAt: { type: Date, default: null }, // soft delete
  },
  baseOptions
);

// 1. Listing: soft-deleted nikal kar category + newest
productSchema.index({ deletedAt: 1, category: 1, createdAt: -1 });

// 2. Search box (ek collection par sirf EK text index allowed hai)
productSchema.index({ title: "text", description: "text" });

// 3. Migration lookup — unique + sparse
productSchema.index({ legacyId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);