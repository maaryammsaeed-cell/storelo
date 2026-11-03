import connectDB from "@/lib/mongodb";
import Setting from "@/lib/models/Setting";

export const defaultSettings = {
  storeName: "Storelo",
  logo: "",
  supportEmail: "",
  currency: "USD",
  locale: "en-US",
  lowStockLimit: 10,
  orderPrefix: "STL",
  hero: {
    before: "Style That Speaks,",
    accent: "Elegance",
    after: "That Lasts.",
    text: "Discover the perfect blend of fashion and elegance with our collection of dresses, shoes, and bags. Find your style, express yourself, and make every moment fashionable.",
    buttonLabel: "Shop Now",
    buttonHref: "#products",
  },
  footer: {
    heading: "Shop with Confidence",
    text: "Quality products, trusted service, and a better shopping experience — every time you shop with us.",
    buttonLabel: "Start Shopping",
    buttonHref: "#products",
  },
  services: [],
};

function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function getSettings() {
  try {
    await connectDB();
    const doc = await Setting.findOne({ key: "store" }).lean();
    if (!doc) return structuredClone(defaultSettings);

    // ObjectId/Date client components me nahi bhej sakte — nikaal do
    const { _id, __v, createdAt, updatedAt, key, ...saved } = doc;

    // Mongo me khali string ("") save ho jaye to default text wapas lao
    const savedHero = saved.hero || {};
    const savedFooter = saved.footer || {};

    return {
      ...defaultSettings,
      ...saved,
      storeName: text(saved.storeName, defaultSettings.storeName),
      hero: {
        before: text(savedHero.before, defaultSettings.hero.before),
        accent: text(savedHero.accent, defaultSettings.hero.accent),
        after: text(savedHero.after, defaultSettings.hero.after),
        text: text(savedHero.text, defaultSettings.hero.text),
        buttonLabel: text(savedHero.buttonLabel, defaultSettings.hero.buttonLabel),
        buttonHref: text(savedHero.buttonHref, defaultSettings.hero.buttonHref),
      },
      footer: {
        heading: text(savedFooter.heading, defaultSettings.footer.heading),
        text: text(savedFooter.text, defaultSettings.footer.text),
        buttonLabel: text(savedFooter.buttonLabel, defaultSettings.footer.buttonLabel),
        buttonHref: text(savedFooter.buttonHref, defaultSettings.footer.buttonHref),
      },
      services: Array.isArray(saved.services)
        ? saved.services.map(({ _id, ...s }) => s)
        : [],
    };
  } catch (error) {
    console.error("Settings read error:", error?.message);
    return structuredClone(defaultSettings);
  }
}