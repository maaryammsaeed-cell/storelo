import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    // Sirf ek hi settings document rahega
    key: { type: String, unique: true, default: "store" },

    storeName: { type: String, default: "Storelo" },
    logo: { type: String, default: "" },
    supportEmail: { type: String, default: "support@storelo.com" },
    currency: { type: String, default: "USD" },
    locale: { type: String, default: "en-US" },
    lowStockLimit: { type: Number, default: 10, min: 0 },
    orderPrefix: { type: String, default: "STL" },

    hero: {
      before: { type: String, default: "" },
      accent: { type: String, default: "" },
      after: { type: String, default: "" },
      text: { type: String, default: "" },
      buttonLabel: { type: String, default: "Shop Now" },
      buttonHref: { type: String, default: "#products" },
    },

    footer: {
      heading: { type: String, default: "" },
      text: { type: String, default: "" },
      buttonLabel: { type: String, default: "Start Shopping" },
      buttonHref: { type: String, default: "#products" },
    },

    services: [
      {
        _id: false,
        title: String,
        description: String,
      },
    ],

    emailNotifications: { type: Boolean, default: true },
    orderNotifications: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Setting ||
  mongoose.model("Setting", settingSchema);
