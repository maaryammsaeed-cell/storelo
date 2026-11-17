// Customers ke derived stats (ordersCount / totalSpent) ko orders se dobara calculate karta hai.
// Migration ke baad ek baar chalana zaroori hai: JSON ke purane counters orders se match nahi karte.
//
// Chalane ka tareeqa:
//   npm run reconcile:customers
//
// Safe hai: sirf do fields update karta hai, koi order delete nahi karta.

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI missing (.env.local check karo).");
  process.exit(1);
}

await mongoose.connect(uri);

const db = mongoose.connection.db;
const customers = await db.collection("customers").find({}).toArray();

// 1) Jin orders par customerId nahi, unhe email se link karo
const byEmail = new Map(
  customers.map((customer) => [
    String(customer.email || "").toLowerCase(),
    customer._id,
  ])
);

const unlinked = await db
  .collection("orders")
  .find({
    $or: [{ customerId: { $exists: false } }, { customerId: null }],
  })
  .toArray();

let linked = 0;

for (const order of unlinked) {
  const id = byEmail.get(String(order.customer?.email || "").toLowerCase());
  if (!id) continue;

  await db
    .collection("orders")
    .updateOne({ _id: order._id }, { $set: { customerId: id } });
  linked += 1;
}

// 2) Stats orders se calculate karo
const grouped = await db
  .collection("orders")
  .aggregate([
    { $match: { customerId: { $ne: null } } },
    {
      $group: {
        _id: "$customerId",
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
      },
    },
  ])
  .toArray();

const statsById = new Map(grouped.map((row) => [String(row._id), row]));

let updated = 0;

for (const customer of customers) {
  const stats = statsById.get(String(customer._id)) || {
    ordersCount: 0,
    totalSpent: 0,
  };

  const ordersCount = Number(stats.ordersCount) || 0;
  const totalSpent = Number(stats.totalSpent) || 0;

  if (
    Number(customer.ordersCount || 0) === ordersCount &&
    Number(customer.totalSpent || 0) === totalSpent
  ) {
    continue;
  }

  await db.collection("customers").updateOne(
    { _id: customer._id },
    { $set: { ordersCount, totalSpent } }
  );

  updated += 1;
}

console.log("orders linked to customers:", linked);
console.log("customers updated:", updated, "/", customers.length);

await mongoose.disconnect();
