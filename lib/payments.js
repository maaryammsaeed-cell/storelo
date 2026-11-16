import mongoose from "mongoose";
import Payment from "@/lib/models/Payment";
import Order from "@/lib/models/Order";
import { holdItem, releaseItem } from "@/lib/stock";

// Payment 30 minute tak hold rahegi
export const HOLD_MS = 30 * 60 * 1000;

function orderPaymentStatusFor(type) {
  if (type === "payment.failed") return "Failed";
  if (type === "payment.cancelled") return "Cancelled";
  if (type === "payment.expired") return "Expired";
  return "Pending";
}

// Preorder / backorder ka stock hold nahi hota
function stockItems(order) {
  return (order.items || []).filter((i) => !i.isPreorder && !i.isBackorder);
}

// Payment banao (ya pehle se bani hui wapas do)
export async function createPaymentIntent(orderId) {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const existing = await Payment.findOne({
        orderId: order._id,
        status: { $in: ["pending", "paid"] },
      }).session(session);

      if (existing) {
        result = { payment: existing.toObject(), order: order.toObject() };
        return;
      }

      const [payment] = await Payment.create(
        [
          {
            orderId: order._id,
            provider: "mock",
            providerPaymentId: "mock_" + crypto.randomUUID(),
            amount: Number(order.totalAmount) || 0,
            currency: "PKR",
            status: "pending",
            expiresAt: new Date(Date.now() + HOLD_MS),
          },
        ],
        { session }
      );

      order.paymentId = payment._id;
      order.reservationExpiresAt = payment.expiresAt;
      await order.save({ session });

      result = { payment: payment.toObject(), order: order.toObject() };
    });
  } catch (error) {
    return { error: error.message };
  } finally {
    await session.endSession();
  }

  return result;
}

// Gateway event lagao (webhook / mock)
export async function applyPaymentEvent(event) {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        $or: [
          ...(mongoose.isValidObjectId(event.paymentId)
            ? [{ _id: event.paymentId }]
            : []),
          { providerPaymentId: String(event.paymentId) },
        ],
      }).session(session);

      if (!payment) throw new Error("PAYMENT_NOT_FOUND");

      // Same event dobara? (webhook duplicate)
      if (payment.events.some((e) => e.id === event.id)) {
        result = {
          duplicate: true,
          paymentStatus: payment.status,
          orderId: String(payment.orderId),
        };
        return;
      }

      const order = await Order.findById(payment.orderId).session(session);
      if (!order) throw new Error("ORDER_NOT_FOUND");

      payment.events.push({ id: event.id, type: event.type, at: new Date() });

      // 41: payment successful
      if (event.type === "payment.succeeded") {
        // Late success: stock release ho chuka tha → dobara hold
        if (order.stockState === "released" || order.stockState === "restocked") {
          const held = [];
          try {
            for (const item of stockItems(order)) {
              const updated = await holdItem(item.productId, item.quantity, session);
              if (!updated) throw new Error("STOCK_UNAVAILABLE");
              held.push(item);
            }
            order.stockState = "held";
          } catch {
            for (const item of held) {
              await releaseItem(item.productId, item.quantity, session);
            }
            payment.status = "needs_refund";
            order.paymentStatus = "Paid";
            await payment.save({ session });
            await order.save({ session });

            result = {
              duplicate: false,
              paymentStatus: payment.status,
              orderStatus: order.status,
              stockState: order.stockState,
            };
            return;
          }
        }

        if (order.stockState === "held") {
          order.stockState = "committed"; // stock pehle hi kam hai
          order.status = "Processing";
          order.paymentStatus = "Paid";
          payment.status = "paid";
        } else {
          // Paisa aa gaya par stock nahi mila
          payment.status = "needs_refund";
          order.paymentStatus = "Paid";
        }
      }

      // 42, 44, 45: fail / cancel / expired
      if (
        event.type === "payment.failed" ||
        event.type === "payment.cancelled" ||
        event.type === "payment.expired"
      ) {
        if (order.stockState === "held") {
          for (const item of stockItems(order)) {
            await releaseItem(item.productId, item.quantity, session);
          }
          order.stockState = "released";
          order.status = "Cancelled";
          order.paymentStatus = orderPaymentStatusFor(event.type);
          payment.status = event.type.replace("payment.", "");
        }
      }

      // 43: pending — stock hold hi rahega
      if (event.type === "payment.pending") {
        payment.status = "pending";
      }

      await payment.save({ session });
      await order.save({ session });

      result = {
        duplicate: false,
        paymentStatus: payment.status,
        orderStatus: order.status,
        stockState: order.stockState,
      };
    });
  } catch (error) {
    return { error: error.message };
  } finally {
    await session.endSession();
  }

  return result;
}

// 43 + 45: pending payments ka waqt khatam → stock wapas
export async function releaseExpiredPayments() {
  const expired = await Payment.find({
    status: "pending",
    expiresAt: { $lt: new Date() },
  })
    .select({ _id: 1 })
    .lean();

  let released = 0;

  for (const item of expired) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const payment = await Payment.findById(item._id).session(session);
        if (!payment || payment.status !== "pending") return;

        const order = await Order.findById(payment.orderId).session(session);

        if (order && order.stockState === "held") {
          for (const line of stockItems(order)) {
            await releaseItem(line.productId, line.quantity, session);
          }
          order.stockState = "released";
          order.status = "Cancelled";
          order.paymentStatus = "Expired";
          await order.save({ session });
        }

        payment.status = "expired";
        payment.events.push({
          id: "expire_" + payment._id.toString(),
          type: "payment.expired",
          at: new Date(),
        });
        await payment.save({ session });

        released += 1;
      });
    } catch (error) {
      console.error("Payment expire failed:", error.message);
    } finally {
      await session.endSession();
    }
  }

  return { released };
}