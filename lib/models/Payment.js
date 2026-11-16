import mongoose from "mongoose";
import { baseOptions } from "./base";

const eventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },   // gateway event id (duplicate check)
    type: {
      type: String,
      enum: [
        "payment.pending",
        "payment.succeeded",
        "payment.failed",
        "payment.cancelled",
        "payment.expired",
      ],
      required: true,
    },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    legacyId: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    provider: { type: String, default: "mock" },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },

    // ⚠️ lowercase — code mein aise hi hai (pending/paid/expired)
    status: {
      type: String,
      enum: ["pending", "paid", "needs_refund", "failed", "cancelled", "expired"],
      default: "pending",
    },

    events: { type: [eventSchema], default: [] },
    expiresAt: { type: Date, default: null },
  },
  baseOptions
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });
// Expiry job ke liye
paymentSchema.index({ status: 1, expiresAt: 1 });
// Webhook duplicate rokne ke liye
paymentSchema.index({ "events.id": 1 });

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);