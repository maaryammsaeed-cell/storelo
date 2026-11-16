import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "order", "invoice" etc.
    seq: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Counter ||
  mongoose.model("Counter", counterSchema);