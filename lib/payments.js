import { readData, writeData, withDbLock } from "@/lib/db";
import { holdStock, commitStock, releaseStock } from "@/lib/stock";

// Payment 30 minute tak hold rahegi
export const HOLD_MS = 30 * 60 * 1000;

// Naya payment record banao (abhi save nahi hota)
export function buildPayment(order) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + HOLD_MS).toISOString();

  return {
    id: "pay_" + crypto.randomUUID(),
    orderId: order.id,
    provider: "mock",
    providerPaymentId: "mock_" + crypto.randomUUID(),
    amount: Number(order.totalAmount) || 0,
    currency: "PKR",
    status: "pending",
    events: [],
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function orderStatusFor(type) {
  if (type === "payment.failed") return "Failed";
  if (type === "payment.cancelled") return "Cancelled";
  if (type === "payment.expired") return "Expired";
  return "Pending";
}

// Late success ke liye: stock dobara hold ho sakta hai?
function canHoldStock(products, order) {
  for (const item of order.items || []) {
    if (item.isPreorder || item.isBackorder) continue;

    const product = products.find((p) => p.id === item.productId);
    if (!product) return false;

    const stock = Number(product.stock) || 0;
    const quantity = Number(item.quantity) || 0;
    if (stock < quantity) return false;
  }

  return true;
}

// Payment banao aur order se jodo
export async function createPaymentIntent(orderId) {
  return withDbLock(async () => {
    const [payments, orders] = await Promise.all([
      readData("payments"),
      readData("orders"),
    ]);

    const order = orders.find((o) => String(o.id) === String(orderId));
    if (!order) return { error: "ORDER_NOT_FOUND" };

    // Pehle se payment hai to wahi wapas do
    const existing = payments.find(
      (p) => p.orderId === order.id && ["pending", "paid"].includes(p.status)
    );
    if (existing) return { payment: existing, order };

    const payment = buildPayment(order);
    payments.unshift(payment);

    order.paymentId = payment.id;
    order.reservationExpiresAt = payment.expiresAt;

    await writeData("payments", payments);
    await writeData("orders", orders);

    return { payment, order };
  });
}

// Gateway event lagao  →  41, 42, 44, 48
await session.withTransaction(async () => {
  const payment = await Payment.findOne({
    $or: [{ _id: paymentId }, { providerPaymentId: paymentId }],
  }).session(session);
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  // duplicate event?
  if (payment.events.some((e) => e.id === event.id)) return;

  payment.events.push({ id: event.id, type: event.type, at: new Date() });
  const order = await Order.findById(payment.orderId).session(session);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  if (event.type === "payment.succeeded") {
    order.status = "Processing";
    order.paymentStatus = "Paid";
    order.paidAt = new Date();
    order.stockState = "committed";     // stock pehle hi hold hai
    payment.status = "paid";
  }

  if (["payment.failed", "payment.cancelled", "payment.expired"].includes(event.type)) {
    if (order.stockState === "held") {
      for (const item of order.items) {
        if (!item.isPreorder && !item.isBackorder) {
          await releaseItem(item.productId, item.quantity, session);
        }
      }
      order.stockState = "released";
      order.status = "Cancelled";
    }
    payment.status = event.type.replace("payment.", "");
  }

  await payment.save({ session });
  await order.save({ session });
});
// 43 + 45: pending payment ka waqt khatam? Stock wapas karo
export async function releaseExpiredPayments() {
  return withDbLock(async () => {
    const [payments, orders, products] = await Promise.all([
      readData("payments"),
      readData("orders"),
      readData("products"),
    ]);

    const now = Date.now();
    let released = 0;

    for (const payment of payments) {
      // Sirf pending payment expire hoti hai
      if (payment.status !== "pending") continue;
      if (!payment.expiresAt) continue;

      const expiry = new Date(payment.expiresAt).getTime();

      // Abhi waqt baqi hai?
      if (!Number.isFinite(expiry) || expiry > now) continue;

      const order = orders.find((o) => o.id === payment.orderId);

      // Order already paid hai to mat chhedo
      if (order && order.stockState === "committed") continue;

      // Stock wapas karo (sirf held stock)
      if (order && order.stockState === "held") {
        releaseStock(products, order);
        order.status = "Cancelled";
        order.paymentStatus = "Expired";
        order.expiredAt = new Date().toISOString();
      }

      payment.status = "expired";
      payment.updatedAt = new Date().toISOString();

      if (!payment.events) payment.events = [];
      payment.events.push({
        id: "expire_" + payment.id,
        type: "payment.expired",
        at: new Date().toISOString(),
      });

      released += 1;
    }

    // Kuch expire nahi hua to file likhne ki zaroorat nahi
    if (released === 0) return { released: 0 };

    await writeData("payments", payments);
    await writeData("orders", orders);
    await writeData("products", products);

    return { released };
  });
}