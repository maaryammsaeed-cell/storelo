// lib/models/Product.js
// MongoDB collection: products
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  // Zaroori fields
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String },

  // Product card par dikhne wale optional fields
  oldPrice: { type: Number }, // agar price se zyada ho to "Sale" badge lagta hai
  colors: { type: [String], default: [] }, // hex colors, jaise ["#1f2119", "#e8e2d6"]
  rating: { type: Number, default: 0 }, // 0 se 5
  reviews: { type: Number, default: 0 }, // kitne logon ne review kiya
});

// Next.js dev mode me model dobara register hone se bachata hai
export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
