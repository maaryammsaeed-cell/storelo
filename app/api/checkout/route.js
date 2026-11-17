import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payment";
import Customer from "@/lib/models/Customer";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
import Counter from "@/lib/models/Counter";

import { holdItem } from "@/lib/stock";
import { HOLD_MS, releaseExpiredPayments } from "@/lib/payments";
import {
  releaseExpiredReservations,
  cancelCartReservation,
} from "@/lib/reserve";
import { getSettings } from "@/lib/settings";
import { getStockState } from "@/lib/product";
import { toDTO } from "@/lib/repo/serialize";

const COOKIE_NAME = "cart_id";

const METHOD_MAP = {
  cod: "Cash on Delivery",
  card: "Credit Card",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
};

function clean(value, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

// Checkout ke andar hone wali "expected" failures
function fail(code, message, extra = {}, status = 409) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.extra = extra;
  throw error; // transaction abort ho jayegi
}

function initialAvatar(name) {
  const initials = String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "CU";
}

export async function POST(request) {
  await connection();

  // 1) Expired holds/payments pehle clear karo (checkout ko block na karein)
  try {
    await releaseExpiredReservations();
    await releaseExpiredPayments();
  } catch (error) {
    console.error("Checkout cleanup failed:", error.message);
  }

  // 2) Body + validation
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const address = clean(body.address, 500);
  const city = clean(body.city, 120);
  const state = clean(body.state, 120);
  const postalCode = clean(body.postalCode, 20);

  const checkoutKey = clean(body.checkoutKey, 100);
  const paymentMethod =
    METHOD_MAP[clean(body.paymentMethod, 40).toLowerCase()] ||
    "Cash on Delivery";
  const isCod = paymentMethod === "Cash on Delivery";

  const buyNowItem = body.buyNowItem;
  const isBuyNow = Boolean(buyNowItem?.productId);
  const selectedProductIds = Array.isArray(body.selectedProductIds)
    ? body.selectedProductIds.map(String)
    : null;

  if (!checkoutKey) {
    return NextResponse.json(
      { error: "CHECKOUT_KEY_MISSING", message: "Please refresh and try again." },
      { status: 400 }
    );
  }

  if (!name || !email || !address) {
    return NextResponse.json(
      { error: "Name, email and address are required" },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // 3) Cart cookie (purani UUID cookie → naya cart, is liye CART_EMPTY)
  const cartId = (await cookies()).get(COOKIE_NAME)?.value;

  if (!cartId || !mongoose.isValidObjectId(cartId)) {
    return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
  }

  const settings = await getSettings();

  // Buy-now: cart ki purani reservation release karo (double deduction se bacho)
  if (isBuyNow) {
    await cancelCartReservation(cartId).catch((error) =>
      console.error("Buy-now reservation cancel failed:", error.message)
    );
  }

  // 4) Transaction
  const session = await mongoose.startSession();
  let payload = null;
  let isExisting = false;

  try {
    await session.withTransaction(async () => {
      // 4.1 Idempotency: same checkoutKey dobara aaya?
      const existing = await Order.findOne({ checkoutKey })
        .session(session)
        .lean();

      if (existing) {
        const existingPayment = existing.paymentId
          ? await Payment.findById(existing.paymentId).session(session).lean()
          : null;

        const dto = toDTO(existing);
        payload = existingPayment
          ? { ...dto, payment: toDTO(existingPayment) }
          : dto;
        isExisting = true;
        return;
      }

      // 4.2 Cart (transaction ke andar padho)
      const cart = await Cart.findById(cartId).session(session).lean();

      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        fail("CART_EMPTY", "Your cart is empty.", {}, 400);
      }

      // Buy-now = sirf woh item; warna selected items; warna poora cart
      const requestedItems = isBuyNow
        ? [
            {
              productId: String(buyNowItem.productId),
              quantity: Math.max(
                1,
                Math.floor(Number(buyNowItem.quantity) || 1)
              ),
            },
          ]
        : selectedProductIds?.length
          ? cart.items
              .filter((item) =>
                selectedProductIds.includes(String(item.productId))
              )
              .map((item) => ({
                productId: String(item.productId),
                quantity: Number(item.quantity) || 1,
              }))
          : cart.items.map((item) => ({
              productId: String(item.productId),
              quantity: Number(item.quantity) || 1,
            }));

      if (requestedItems.length === 0) {
        fail("CART_EMPTY", "Your cart is empty.", {}, 400);
      }

      // 4.3 Reservation cart se match karti hai? (buy-now me reservation nahi)
      const reservation = isBuyNow ? null : cart.reservation || null;

      if (reservation) {
        const same =
          reservation.items.length === requestedItems.length &&
          requestedItems.every((item) => {
            const reserved = reservation.items.find(
              (entry) => String(entry.productId) === item.productId
            );
            return reserved && reserved.quantity === item.quantity;
          });

        if (!same) {
          fail(
            "RESERVATION_MISMATCH",
            "Your cart changed. Please refresh the checkout page.",
            {},
            409
          );
        }
      }

      // 4.4 Order number (atomic counter)
      const counter = await Counter.findOneAndUpdate(
        { _id: "order" },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after", session }
      ).lean();

      const orderNumber = `${settings.orderPrefix || "STL"}-${String(
        counter.seq
      ).padStart(6, "0")}`;

      // 4.5 Stock hold + order items snapshot
      const orderItems = [];
      let subtotal = 0;

      for (const item of requestedItems) {
        const product = await Product.findOne({
          _id: item.productId,
          deletedAt: null,
        })
          .session(session)
          .lean();

        if (!product) {
          fail(
            "PRODUCT_NOT_FOUND",
            "A product is no longer available. Please remove it from your cart.",
            { productId: item.productId },
            409
          );
        }

        const stockState = getStockState(product, settings);
        const reservedEntry = reservation?.items?.find(
          (entry) => String(entry.productId) === item.productId
        );

        let isPreorder = false;
        let isBackorder = false;

        if (reservation) {
          // Stock pehle hi kam ho chuka hai — sirf flags chahiye
          isPreorder = product.status === "preorder";
          isBackorder = reservedEntry
            ? reservedEntry.held === false && !isPreorder
            : false;
        } else {
          if (!stockState.canAddToCart) {
            fail(
              stockState.state.toUpperCase(),
              stockState.message,
              { productId: item.productId },
              409
            );
          }

          isPreorder = Boolean(stockState.isPreorder);
          isBackorder = Boolean(stockState.isBackorder);
        }

        const special = isPreorder || isBackorder;

        // Atomic hold (preorder/backorder ka stock hold nahi hota)
        if (!reservation && !special) {
          const available = Number(stockState.stock);

          if (!Number.isFinite(available) || item.quantity > available) {
            fail(
              "STOCK_LIMIT",
              `Only ${available} item(s) left`,
              { productId: item.productId, available },
              409
            );
          }

          const held = await holdItem(item.productId, item.quantity, session);

          if (!held) {
            const fresh = await Product.findById(item.productId)
              .session(session)
              .lean();
            const left = fresh ? Math.max(0, Number(fresh.stock) || 0) : 0;

            fail(
              "STOCK_LIMIT",
              `Only ${left} item(s) left`,
              { productId: item.productId, available: left },
              409
            );
          }
        }

        const price = Number(product.price) || 0;
        subtotal += price * item.quantity;

        orderItems.push({
          productId: product._id,
          title: product.title,
          price,
          quantity: item.quantity,
          lineTotal: price * item.quantity,
          isPreorder,
          isBackorder,
        });
      }

      // 4.6 Customer stats (email se upsert)
      const parts = name.split(" ").filter(Boolean);
      const customerSet = {};

      if (phone) customerSet.phone = phone;

      const customer = await Customer.findOneAndUpdate(
        { email },
        {
          $inc: { ordersCount: 1, totalSpent: subtotal },
          ...(Object.keys(customerSet).length ? { $set: customerSet } : {}),
          $setOnInsert: {
            name: {
              firstname: parts[0] || "",
              lastname: parts.slice(1).join(" "),
            },
            username: email.split("@")[0],
            joinedDate: new Date(),
            status: "Active",
            address: {
              street: address,
              city,
              state,
              zipcode: postalCode,
              number: "",
            },
          },
        },
        { upsert: true, returnDocument: "after", session }
      ).lean();

      // 4.7 Order
      const [order] = await Order.create(
        [
          {
            checkoutKey,
            orderNumber,
            date: new Date(),
            customerId: customer?._id,
            customer: {
              name,
              email,
              phone,
              address,
              city,
              state,
              postalCode,
              avatar: initialAvatar(name),
            },
            items: orderItems,
            itemsCount: orderItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            itemsSummary: orderItems
              .map((item) => `${item.title} x${item.quantity}`)
              .join(", "),
            totalAmount: subtotal,
            status: isCod ? "Processing" : "Pending Payment",
            paymentMethod,
            paymentStatus: "Pending",
            // Reservation ne stock pehle hi hold kiya hua hai
            stockState: isCod ? "committed" : "held",
            hasPreorder: orderItems.some((item) => item.isPreorder),
            hasBackorder: orderItems.some((item) => item.isBackorder),
          },
        ],
        { session }
      );

      // 4.8 Online payment (stock "held" rahega)
      let payment = null;

      if (!isCod) {
        [payment] = await Payment.create(
          [
            {
              orderId: order._id,
              provider: "mock",
              providerPaymentId: "mock_" + crypto.randomUUID(),
              amount: subtotal,
              currency: settings.currency || "PKR",
              status: "pending",
              expiresAt: new Date(Date.now() + HOLD_MS),
            },
          ],
          { session }
        );

        order.paymentId = payment._id;
        order.reservationExpiresAt = payment.expiresAt;
        await order.save({ session });
      }

      // 4.9 Cart cleanup (purchased items nikaalo, reservation hatao)
      const pullIds = isBuyNow
        ? [String(buyNowItem.productId)]
        : selectedProductIds?.length
          ? selectedProductIds.filter((id) => mongoose.isValidObjectId(id))
          : null;

      const cartUpdate = { $unset: { reservation: "" } };

      if (pullIds?.length) {
        cartUpdate.$pull = { items: { productId: { $in: pullIds } } };
      } else {
        cartUpdate.$set = { items: [] };
      }

      await Cart.updateOne({ _id: cartId }, cartUpdate, { session });

      // 4.10 Response (client orderNumber/customer/hasPreorder padhta hai)
      const orderDto = toDTO(order.toObject());

      payload = payment
        ? { ...orderDto, payment: toDTO(payment.toObject()) }
        : orderDto;
    });
  } catch (error) {
    // Same checkoutKey ki race → doosri request jeet gayi, usi ka order do
    if (error?.code === 11000) {
      const existing = await Order.findOne({ checkoutKey }).lean().catch(() => null);

      if (existing) {
        return NextResponse.json(toDTO(existing), { status: 200 });
      }
    }

    const needsReplicaSet = String(error?.message || "").includes(
      "Transaction numbers are only allowed"
    );

    console.error(
      "CHECKOUT FAILED:",
      error?.code || "",
      error?.message || error
    );

    return NextResponse.json(
      {
        error: needsReplicaSet
          ? "REPLICA_SET_REQUIRED"
          : error?.code || "CHECKOUT_FAILED",
        message: needsReplicaSet
          ? "Checkout needs a MongoDB replica set (Atlas or a local replica set)."
          : error?.status
            ? error.message
            : "Order could not be placed. Stock was not deducted. Please try again.",
        ...(error?.extra || {}),
      },
      { status: error?.status || 500 }
    );
  } finally {
    await session.endSession();
  }

  if (!payload) {
    return NextResponse.json(
      { error: "CHECKOUT_FAILED", message: "Order could not be placed." },
      { status: 500 }
    );
  }

  return NextResponse.json(payload, { status: isExisting ? 200 : 201 });
}
