import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { readData, writeData, withDbLock } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getStockState } from "@/lib/product";
import {
  releaseExpiredReservations,
  cancelCartReservation,
} from "@/lib/reserve";
import { buildPayment ,  releaseExpiredPayments  } from "@/lib/payments";
import { holdStock, commitStock } from "@/lib/stock";

const COOKIE_NAME = "cart_id";

function clean(value, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request) {
  await connection();
  await releaseExpiredReservations();
    await releaseExpiredPayments();
  const body = await request.json().catch(() => null);

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 160).toLowerCase();
  const phone = clean(body?.phone, 40);
  const address = clean(body?.address, 500);
  const city = clean(body?.city, 120);
  const state = clean(body?.state, 120);
    const postalCode = clean(body?.postalCode, 20);
    // Checkout page "cod" bhejta hai
  const rawMethod = clean(body?.paymentMethod, 40).toLowerCase();
  const methodMap = {
    cod: "Cash on Delivery",
    card: "Credit Card",
    easypaisa: "Easypaisa",
    jazzcash: "JazzCash",
  };
  const paymentMethod = methodMap[rawMethod] || "Cash on Delivery";
  const isCod = paymentMethod === "Cash on Delivery";

  const checkoutKey = clean(body?.checkoutKey, 100);
  const buyNowItem = body?.buyNowItem;
  const isBuyNow = Boolean(buyNowItem?.productId);
   const selectedProductIds = Array.isArray(body?.selectedProductIds)
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

  const cookieStore = await cookies();
  const cartId = cookieStore.get(COOKIE_NAME)?.value;

  if (!cartId) {
    return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
  }

  // Buy-now checkout: purani reservation release karo (double deduction se bacho)
  if (isBuyNow) {
    await cancelCartReservation(cartId);
  }

  const settings = await getSettings();

  return withDbLock(async () => {
    const [carts, products, orders, customers , payments] = await Promise.all([
      readData("carts"),
      readData("products"),
      readData("orders"),
      readData("customers"),
      readData("payments"),
    ]);

    // Customer ka cart dhoondo (ye line missing thi — isi se 500 aa raha tha)
    const cart = carts.find((c) => c.id === cartId);

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
    }

    // Same checkout pehle already ho chuka hai?
    const existingOrder = orders.find(
      (order) => order.checkoutKey === checkoutKey
    );

      if (existingOrder) {
      const existingPayment = payments.find(
        (p) => p.id === existingOrder.paymentId
      );
      return NextResponse.json(
        existingPayment
          ? { ...existingOrder, payment: existingPayment }
          : existingOrder,
        { status: 200 }
      );
    }
     // Buy-now = sirf woh item; warna customer ke selected items; warna poora cart
    const cartItems =
      selectedProductIds && selectedProductIds.length > 0
        ? cart.items.filter((item) =>
            selectedProductIds.includes(item.productId)
          )
        : cart.items;

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
    }

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
      : cartItems;


    // Rollback ke liye purani state change se PEHLE yaad rakho
    const productsBefore = structuredClone(products);
    const ordersBefore = structuredClone(orders);
    const cartsBefore = structuredClone(carts);
    const customersBefore = structuredClone(customers);
        const paymentsBefore = structuredClone(payments);
    // Reservation cart se match karti hai? (buy-now me nahi)
    if (!isBuyNow && cart.reservation) {
      const same =
        cart.reservation.items.length === requestedItems.length &&
        requestedItems.every((item) => {
          const r = cart.reservation.items.find(
            (x) => x.productId === item.productId
          );
          return r && r.quantity === item.quantity;
        });

      if (!same) {
        return NextResponse.json(
          {
            error: "RESERVATION_MISMATCH",
            message: "Your cart changed. Please refresh the checkout page.",
          },
          { status: 409 }
        );
      }
    }
    const byId = new Map(products.filter((p) => !p.deletedAt).map((product) => [product.id, product]));
    const orderItems = [];
    let subtotal = 0;

    for (const item of requestedItems) {
      const product = byId.get(item.productId);

      if (!product) {
        return NextResponse.json(
          {
            error: "PRODUCT_NOT_FOUND",
            productId: item.productId,
            message: "A product is no longer available. Please remove it from your cart.",
          },
          { status: 409 }
        );
      }
      const state = getStockState(product, settings);

      // Reservation hai to stock pehle hi kam ho chuka hai
      if (!cart.reservation) {
        if (!state.canAddToCart) {
          return NextResponse.json(
            {
              error: state.state.toUpperCase(),
              message: state.message,
              productId: product.id,
            },
            { status: 409 }
          );
        }

        if (!state.isPreorder && !state.isBackorder) {
          const available = Number(state.stock);

          if (!Number.isFinite(available) || item.quantity > available) {
            return NextResponse.json(
              {
                error: "STOCK_LIMIT",
                productId: product.id,
                available: state.stock,
                message: `Only ${state.stock} item(s) left`,
              },
              { status: 409 }
            );
          }

         
        }

        if (state.isBackorder) {
          product.stock = 0;
        }
      }

      const price = Number(product.price) || 0;
      subtotal += price * item.quantity;

      orderItems.push({
        productId: product.id,
        title: product.title,
        price,
        quantity: item.quantity,
        lineTotal: price * item.quantity,
        isPreorder: state.isPreorder,
        isBackorder: state.isBackorder,
      });
    }

    const order = {
      id: crypto.randomUUID(),
      checkoutKey,
      orderNumber: `${settings.orderPrefix || "STL"}-${Date.now()
        .toString()
        .slice(-6)}`,
      date: new Date().toISOString(),
      customer: {
        name,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        avatar:
          name
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "CU",
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
      stockState: null,
      paymentId: null,
      reservationExpiresAt: null,
      hasPreorder: orderItems.some((item) => item.isPreorder),
      hasBackorder: orderItems.some((item) => item.isBackorder),
    };

    // Customer ko customers.json me add ya update karo
        // Reservation ne stock pehle hi hold kiya hua hai?
    if (cart.reservation) {
      order.stockState = "held";
    } else {
      holdStock(products, order);
    }

    let payment = null;

    if (isCod) {
      // COD: paisa delivery par, stock pakka kar do
      commitStock(products, order);
    } else {
      // Online: stock hold rahega
      payment = buildPayment(order);
      payments.unshift(payment);
      order.paymentId = payment.id;
      order.reservationExpiresAt = payment.expiresAt;
    }
    const existingCustomer = customers.find(
      (c) => String(c.email || "").toLowerCase() === email
    );

    if (existingCustomer) {
      existingCustomer.ordersCount = (existingCustomer.ordersCount || 0) + 1;
      existingCustomer.totalSpent =
        (existingCustomer.totalSpent || 0) + subtotal;
      existingCustomer.phone = phone || existingCustomer.phone;
      existingCustomer.address = {
        ...(existingCustomer.address || {}),
        city: city || existingCustomer.address?.city || "",
        state: state || existingCustomer.address?.state || "",
        zipcode: postalCode || existingCustomer.address?.zipcode || "",
        street: address || existingCustomer.address?.street || "",
      };
    } else {
      const parts = name.split(" ").filter(Boolean);

      customers.unshift({
        id: crypto.randomUUID(),
        name: {
          firstname: parts[0] || "",
          lastname: parts.slice(1).join(" "),
        },
        email,
        username: email.split("@")[0],
        phone,
        address: {
          city,
          state,
          street: address,
          number: "",
          zipcode: postalCode,
        },
        status: "Active",
        ordersCount: 1,
        totalSpent: subtotal,
        joinedDate: new Date().toISOString(),
      });
    }

    orders.unshift(order);

    if (isBuyNow) {
      cart.items = cart.items.filter(
        (item) => item.productId !== String(buyNowItem.productId)
      );
    }
    else if (selectedProductIds && selectedProductIds.length > 0) {
      cart.items = cart.items.filter(
        (item) => !selectedProductIds.includes(item.productId)
      );
    }else {
      cart.items = [];
    }

    delete cart.reservation;
    cart.updatedAt = new Date().toISOString();

    try {
      await writeData("products", products);
      await writeData("orders", orders);
      await writeData("carts", carts);
      await writeData("customers", customers);
      if (payment) await writeData("payments", payments);
    } catch (error) {
      console.error("CHECKOUT WRITE FAILED, rolling back:", error);

      // Jo write ho chuki ho, sab wapas purani state par le aao
      await writeData("products", productsBefore).catch(() => { });
      await writeData("orders", ordersBefore).catch(() => { });
      await writeData("carts", cartsBefore).catch(() => { });
      await writeData("customers", customersBefore).catch(() => { });
      await writeData("payments", paymentsBefore).catch(() => { });
      
      return NextResponse.json(
        {
          error: "CHECKOUT_FAILED",
          message:
            "Order could not be placed. Stock was not deducted. Please try again.",
        },
        { status: 500 }
      );
    }

       return NextResponse.json(
      payment ? { ...order, payment } : order,
      { status: 201 }
    );
  });
}