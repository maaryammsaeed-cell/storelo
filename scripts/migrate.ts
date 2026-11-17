// scripts/migrate.ts
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import Product from "../lib/models/Product";
import Customer from "../lib/models/Customer";
import Order from "../lib/models/Order";
import Payment from "../lib/models/Payment";

// purane status → canonical status
const ORDER_STATUS_MAP: Record<string, string> = {
  pending: "Pending Payment",
  "pending payment": "Pending Payment",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

function normalizeOrderStatus(value: unknown) {
  const key = String(value || "").trim().toLowerCase();
  return ORDER_STATUS_MAP[key] ?? (String(value ?? "").trim() || "Processing");
}

// ---------- env load (Next ke bahar .env.local khud nahi padhta) ----------

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* .env.local na ho to koi baat nahi */ }
}

const DRY = process.argv.includes("--dry");
const DB_DIR = path.join(process.cwd(), "data", "db");
const MAP_FILE = path.join(process.cwd(), "data", "id-map.json");
const REPORT_FILE = path.join(process.cwd(), "data", "migration-report.json");

const idMap: Record<string, Record<string, string>> = {
  products: {}, customers: {}, orders: {}, payments: {},
};

type MigrationCount = { total: number; ok: number; failed: number };
type LegacyOrderItem = {
  productId?: unknown;
  title?: string;
  price?: number | string;
  quantity?: number | string;
  lineTotal?: number | string;
  isPreorder?: boolean;
  isBackorder?: boolean;
};
type LegacyPaymentEvent = { id?: string; type?: string; at?: string | Date };
type MigrationError = {
  collection: string;
  legacyId: string;
  message: string;
  fields?: string[];
};

const report: {
  startedAt: string;
  dry: boolean;
  counts: Record<string, MigrationCount>;
  errors: MigrationError[];
} = {
  startedAt: new Date().toISOString(),
  dry: DRY,
  counts: {},
  errors: [],
};

// ---------- helpers ----------
async function readJson(name: string) {
  try {
    return JSON.parse(await fs.readFile(path.join(DB_DIR, `${name}.json`), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

function toDate(v: unknown) {
  if (!v) return null;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapId(kind: string, oldId: unknown) {
  return oldId ? idMap[kind]?.[String(oldId)] : undefined;
}

// idempotent: legacyId mila to wahi doc, warna naya insert
async function upsert(
  Model: mongoose.Model<Record<string, unknown>>,
  legacyId: string,
  doc: Record<string, unknown>
) {
  await new Model(doc).validate();

  if (DRY) return { _id: new mongoose.Types.ObjectId(), dryRun: true };

  return Model.findOneAndUpdate(
    { legacyId },
    { $setOnInsert: doc },
    { upsert: true,returnDocument: "after", setDefaultsOnInsert: true }
  );
}

function logError(collection: string, legacyId: string, err: unknown) {
  const errors = (err as { errors?: Record<string, unknown> })?.errors;

  report.errors.push({
    collection,
    legacyId,
    message: err instanceof Error ? err.message : String(err),
    fields: errors ? Object.keys(errors) : undefined,
  });
}

// ---------- main ----------
async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing (.env.local)");

  if (!DRY) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
  } else {
    console.log("🧪 DRY RUN — kuch bhi save nahi hoga");
  }

  // ... (Steps 4–8 yahan aayenge)
    // ---------- 1. PRODUCTS ----------
  const products = await readJson("products");
  report.counts.products = { total: products.length, ok: 0, failed: 0 };

  for (const p of products) {
    try {
      const doc = {
        legacyId: String(p.id),
        title: p.title,
        description: p.description ?? "",
        price: Number(p.price) || 0,
        oldPrice: p.oldPrice != null ? Number(p.oldPrice) : null,
        image: p.image ?? "",
        category: p.category ?? "",
        colors: Array.isArray(p.colors) ? p.colors : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        stock: Number(p.stock) || 0,
        status: p.status || "active",
        allowBackorder: Boolean(p.allowBackorder),
        preorderReleaseDate: toDate(p.preorderReleaseDate),
        showInCollections: p.showInCollections !== false,
        rating: Number(p.rating) || 0,
        reviews: Number(p.reviews) || 0,
        deletedAt: toDate(p.deletedAt),
      };

      const saved = await upsert(Product, doc.legacyId, doc);
      idMap.products[String(p.id)] = String(saved._id);
      report.counts.products.ok++;
    } catch (e) {
      report.counts.products.failed++;
      logError("products", String(p.id), e);
    }
  }
  console.log(`products: ${report.counts.products.ok}/${report.counts.products.total}`);

    // ---------- 2. CUSTOMERS ----------
  const customers = await readJson("customers");
  report.counts.customers = { total: customers.length, ok: 0, failed: 0 };

  const emailToCustomerId: Record<string, string> = {};

  for (const c of customers) {
    try {
      const email = String(c.email || "").toLowerCase();
      const doc = {
        legacyId: String(c.id),
        name: {
          firstname: c.name?.firstname ?? "",
          lastname: c.name?.lastname ?? "",
        },
        email,
        username: c.username ?? "",
        phone: c.phone ?? "",
        address: {
          city: c.address?.city ?? "",
          state: c.address?.state ?? "",
          street: c.address?.street ?? "",
          number: c.address?.number ?? "",
          zipcode: c.address?.zipcode ?? "",
        },
        status: c.status || "Active",
        ordersCount: Number(c.ordersCount) || 0,
        totalSpent: Number(c.totalSpent) || 0,
        joinedDate: toDate(c.joinedDate) ?? new Date(),
      };

      const saved = await upsert(Customer, doc.legacyId, doc);
      idMap.customers[String(c.id)] = String(saved._id);
      if (email) emailToCustomerId[email] = String(saved._id);
      report.counts.customers.ok++;
    } catch (e) {
      report.counts.customers.failed++;
      logError("customers", String(c.id), e);
    }
  }
  console.log(`customers: ${report.counts.customers.ok}/${report.counts.customers.total}`);
  // ---------- 3. ORDERS ----------
  const orders = await readJson("orders");
  report.counts.orders = { total: orders.length, ok: 0, failed: 0 };

  for (const o of orders) {
    try {
      const custEmail = String(o.customer?.email || "").toLowerCase();

      const items = (o.items || []).map((it: LegacyOrderItem) => ({
        productId: mapId("products", it.productId),
        title: it.title ?? "Unknown",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        lineTotal: Number(it.lineTotal) || (Number(it.price) || 0) * (Number(it.quantity) || 1),
        isPreorder: Boolean(it.isPreorder),
        isBackorder: Boolean(it.isBackorder),
      }));

      const doc = {
        legacyId: String(o.id),
        checkoutKey: o.checkoutKey || `legacy-${o.id}`,     // required + unique
        orderNumber: o.orderNumber || `STL-${String(o.id).slice(0, 6)}`,
        date: toDate(o.date) ?? new Date(),

        customerId: mapId("customers", o.customerId) || emailToCustomerId[custEmail],
        customer: {
          name: o.customer?.name ?? "Unknown",
          email: o.customer?.email ?? "",
          phone: o.customer?.phone ?? "",
          address: o.customer?.address ?? "",
          city: o.customer?.city ?? "",
          state: o.customer?.state ?? "",
          postalCode: o.customer?.postalCode ?? "",
          avatar: o.customer?.avatar ?? "",
        },

        items,
        itemsCount:
          Number(o.itemsCount) ||
          items.reduce(
            (s: number, i: { quantity: number }) => s + i.quantity,
            0
          ),
        itemsSummary: o.itemsSummary ?? "",
        totalAmount:
          Number(o.totalAmount) ||
          items.reduce(
            (s: number, i: { lineTotal: number }) => s + i.lineTotal,
            0
          ),

       status: normalizeOrderStatus(o.status),
        paymentMethod: o.paymentMethod || "Cash on Delivery",
        paymentStatus: o.paymentStatus || "Pending",
        stockState: o.stockState ?? null,
        paymentId: null,                                  // Step 7 ke baad link hoga
        reservationExpiresAt: toDate(o.reservationExpiresAt),
        hasPreorder: Boolean(o.hasPreorder),
        hasBackorder: Boolean(o.hasBackorder),
        restockedAt: toDate(o.restockedAt),
      };

      const saved = await upsert(Order, doc.legacyId, doc);
      idMap.orders[String(o.id)] = String(saved._id);
      report.counts.orders.ok++;
    } catch (e) {
      report.counts.orders.failed++;
      logError("orders", String(o.id), e);
    }
  }
  console.log(`orders: ${report.counts.orders.ok}/${report.counts.orders.total}`);

  // 3b. Legacy orders ke timestamps asal order date par (JSON me createdAt/
  // updatedAt thay hi nahi — warna migration ka waqt dikhta hai).
  if (!DRY) {
    const fixed = await Order.collection.updateMany(
      { legacyId: { $exists: true, $ne: null } },
      [
        {
          $set: {
            createdAt: { $ifNull: ["$date", "$createdAt"] },
            updatedAt: { $ifNull: ["$date", "$createdAt"] },
          },
        },
      ]
    );
    console.log(`orders timestamps (createdAt/updatedAt = date): ${fixed.modifiedCount}`);
  }

    // ---------- 4. PAYMENTS ----------
  const payments = await readJson("payments");
  report.counts.payments = { total: payments.length, ok: 0, failed: 0 };

  for (const p of payments) {
    try {
      const doc = {
        legacyId: String(p.id),
        orderId: mapId("orders", p.orderId),
        provider: p.provider || "mock",
        providerPaymentId: p.providerPaymentId || undefined,
        amount: Number(p.amount) || 0,
        currency: p.currency || "PKR",
        status: p.status || "pending",
        events: (p.events || []).map((e: LegacyPaymentEvent) => ({
          id: e.id ?? `evt-${e.type}-${p.id}`,
          type: e.type,
          at: toDate(e.at) ?? new Date(),
        })),
        expiresAt: toDate(p.expiresAt),
      };

      const saved = await upsert(Payment, doc.legacyId, doc);
      idMap.payments[String(p.id)] = String(saved._id);
      report.counts.payments.ok++;
    } catch (e) {
      report.counts.payments.failed++;
      logError("payments", String(p.id), e);
    }
  }
  console.log(`payments: ${report.counts.payments.ok}/${report.counts.payments.total}`);

  // ---------- 4b. ORDER ↔ PAYMENT LINK (second pass) ----------
  if (!DRY) {
    for (const p of payments) {
      const orderId = mapId("orders", p.orderId);
      const paymentId = idMap.payments[String(p.id)];
      if (orderId && paymentId) {
        await Order.updateOne(
          { _id: orderId },
          { $set: { paymentId } }
        );
      }
    }
    console.log("orders ↔ payments linked");
  }


  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
  if (!DRY) await fs.writeFile(MAP_FILE, JSON.stringify(idMap, null, 2));

  console.log("\n===== SUMMARY =====");
  console.log(JSON.stringify(report.counts, null, 2));
  console.log("Errors:", report.errors.length);

  if (!DRY) await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("💥 Migration failed:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});