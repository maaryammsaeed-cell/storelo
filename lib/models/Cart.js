import mongoose from "mongoose";
import { baseOptions } from "./base";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const reservationItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    held: { type: Boolean, default: true },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    expiresAt: { type: Date, default: null },
    items: { type: [reservationItemSchema], default: [] },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    legacyId: { type: String },
    items: { type: [cartItemSchema], default: [] },
    reservation: { type: reservationSchema, default: null },
  },
  baseOptions
);

// Purane carts clean karne ke liye
cartSchema.index({ updatedAt: 1 });
// Expired reservation dhoondne ke liye
cartSchema.index({ "reservation.expiresAt": 1 });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);