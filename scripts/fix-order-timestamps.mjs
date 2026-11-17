// Legacy (JSON se migrate hue) orders ke createdAt / updatedAt ko unki asal
// order date par set karta hai.
//
// Kyun? Purani JSON files mein createdAt/updatedAt fields thay hi nahi — sirf
// `date` tha. Is liye migration ke baad createdAt/updatedAt "migration ka waqt"
// dikha rahe the, jo orders ki history ke liye ghalat lagta hai.
//
// Chalane ka tareeqa:
//   npm run fix:order-times          (asli update)
//   node --env-file=.env.local scripts/fix-order-timestamps.mjs --dry
//
// Sirf legacyId wale orders chhoote hain — naye (app se bane) orders ke
// timestamps bilkul waisay hi rehte hain.

import mongoose from "mongoose";

const DRY = process.argv.includes("--dry");
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI missing (.env.local check karo).");
  process.exit(1);
}

await mongoose.connect(uri);

const orders = mongoose.connection.db.collection("orders");
const filter = { legacyId: { $exists: true, $ne: null } };

const total = await orders.countDocuments(filter);
const needsFix = await orders.countDocuments({
  ...filter,
  $expr: { $ne: ["$updatedAt", "$date"] },
});

console.log(`legacy orders: ${total} | fix chahiye: ${needsFix}`);

if (DRY) {
  const sample = await orders.find(filter).sort({ date: 1 }).limit(5).toArray();
  for (const o of sample) {
    console.log(
      o.orderNumber,
      "| date:",
      o.date?.toISOString(),
      "| abhi updatedAt:",
      o.updatedAt?.toISOString()
    );
  }
  console.log("\nDRY RUN — kuch save nahi hua.");
} else {
  // Native update (pipeline) — Mongoose timestamps khud override nahi karta.
  const res = await orders.updateMany(filter, [
    {
      $set: {
        createdAt: { $ifNull: ["$date", "$createdAt"] },
        updatedAt: { $ifNull: ["$date", "$createdAt"] },
      },
    },
  ]);

  console.log(`updated: ${res.modifiedCount}`);

  const left = await orders.countDocuments({
    ...filter,
    $expr: { $ne: ["$updatedAt", "$date"] },
  });
  console.log(`baaki (updatedAt != date): ${left}`);
}

await mongoose.disconnect();
