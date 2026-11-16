import mongoose from "mongoose";
import { baseOptions } from "./base";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // snapshot — product badle to order nahi badalna chahiye
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    isPreorder: { type: Boolean, default: false },
    isBackorder: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderCustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    legacyId: { type: String },
    checkoutKey: { type: String, required: true }, // idempotency
    orderNumber: { type: String, required: true },
    date: { type: Date, default: Date.now },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customer: { type: orderCustomerSchema, required: true },

    items: { type: [orderItemSchema], default: [] },
    itemsCount: { type: Number, default: 0 },
    itemsSummary: { type: String, default: "" },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["Pending Payment", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    paymentMethod: {
      type: String,
      enum: [
        "Cash on Delivery",
        "Credit Card",
        "Credit Card (Visa)",
        "Credit Card (Mastercard)",
        "Easypaisa",
        "JazzCash",
        "Apple Pay",
        "PayPal",
      ],
      default: "Cash on Delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Cancelled", "Expired", "Refunded"],
      default: "Pending",
    },

    // code mein 4 values hain: held, committed, released, restocked
    stockState: {
      type: String,
      enum: ["held", "committed", "released", "restocked", null],
      default: null,
    },

    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    reservationExpiresAt: { type: Date, default: null },
    hasPreorder: { type: Boolean, default: false },
    hasBackorder: { type: Boolean, default: false },
    restockedAt: { type: Date, default: null },
  },
  baseOptions
);

orderSchema.index({ checkoutKey: 1 }, { unique: true }); // double order rokta hai
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customerId: 1, createdAt: -1 }); // customer order history
orderSchema.index({ status: 1, createdAt: -1 }); // admin filter
orderSchema.index({ paymentId: 1 }, { sparse: true });
orderSchema.index({ legacyId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);