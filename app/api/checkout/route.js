import mongoose from "mongoose";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payment";
import Customer from "@/lib/models/Customer";
import Counter from "@/lib/models/Counter";
import { holdItem } from "@/lib/stock";
import { getCart, clearCart } from "@/lib/repo/carts";

const session = await mongoose.startSession();

let payload;
let failure = null;

try {
  await session.withTransaction(async () => {
    // 1) Idempotency: same checkoutKey pehle aaya?
    const existing = await Order.findOne({ checkoutKey }).session(session).lean();
    if (existing) { payload = { existing: true, order: existing }; return; }

    // 2) Cart
    const cart = await getCart(cartId);
    if (!cart || cart.items.length === 0) throw new Error("CART_EMPTY");

    const items = isBuyNow
      ? [{ productId: String(buyNowItem.productId), quantity: Math.max(1, Math.floor(Number(buyNowItem.quantity) || 1)) }]
      : selectedProductIds?.length
        ? cart.items.filter((i) => selectedProductIds.includes(String(i.productId)))
        : cart.items;

    // 3) Order number
    const counter = await Counter.findOneAndUpdate(
      { _id: "order" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", session }
    );
    const orderNumber = `${settings.orderPrefix || "STL"}-${String(counter.seq).padStart(6, "0")}`;

    // 4) Stock + order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const held = cart.reservation   // reservation = stock pehle hi kam hai
        ? null
        : await holdItem(item.productId, item.quantity, session);

      if (!cart.reservation && !held) throw new Error(`STOCK_LIMIT:${item.productId}`);

      const product = held || await Product.findById(item.productId).session(session).lean();
      const price = Number(product.price) || 0;
      subtotal += price * item.quantity;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price,
        quantity: item.quantity,
        lineTotal: price * item.quantity,
      });
    }

    // 5) Order
    const [order] = await Order.create([{
      checkoutKey,
      orderNumber,
      date: new Date(),
      customer: { name, email, phone, address, city, state, postalCode },
      items: orderItems,
      itemsCount: orderItems.reduce((s, i) => s + i.quantity, 0),
      itemsSummary: orderItems.map((i) => `${i.title} x${i.quantity}`).join(", "),
      totalAmount: subtotal,
      status: isCod ? "Processing" : "Pending Payment",
      paymentMethod,
      paymentStatus: "Pending",
      stockState: cart.reservation ? "held" : "held",   // COD → committed
    }], { session });

    // 6) Payment (online only)
    if (!isCod) {
      const [payment] = await Payment.create([{
        orderId: order._id,
        provider: "mock",
        providerPaymentId: "mock_" + crypto.randomUUID(),
        amount: subtotal,
        currency: "PKR",
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      }], { session });
      order.paymentId = payment._id;
      await order.save({ session });
      payload = { order, payment };
    } else {
      order.stockState = "committed";
      await order.save({ session });
      payload = { order };
    }

    // 7) Customer stats
    await Customer.findOneAndUpdate(
      { email },
      {
        $inc: { ordersCount: 1, totalSpent: subtotal },
        $setOnInsert: {
          name: { firstname: name.split(" ")[0] || "", lastname: name.split(" ").slice(1).join(" ") },
          username: email.split("@")[0],
          joinedDate: new Date(),
          status: "Active",
        },
        $set: { phone: phone || "" },
      },
      { upsert: true, session }
    );

    // 8) Cart clear
    await clearCart(cartId);   // note: reservation bhi clear karo
    await Cart.updateOne({ _id: cartId }, { $unset: { reservation: "" } }, { session });
  });
} catch (error) {
  failure = error.message;
} finally {
  await session.endSession();
}