import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { readData, writeData, withDbLock } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getStockState } from "@/lib/product";

const COOKIE_NAME = "cart_id";

function clean(value, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request) {
  await connection();

  const body = await request.json().catch(() => null);

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 160).toLowerCase();
  const phone = clean(body?.phone, 40);
  const address = clean(body?.address, 500);
  const city = clean(body?.city, 120);

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

  const settings = await getSettings();

  return withDbLock(async () => {
    const [carts, products, orders] = await Promise.all([
      readData("carts"),
      readData("products"),
      readData("orders"),
    ]);

    const cart = carts.find((entry) => entry.id === cartId);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
    }

    const byId = new Map(products.map((product) => [product.id, product]));
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
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

        product.stock = Math.max(0, available - item.quantity);
      }

      if (state.isBackorder) {
        product.stock = 0;
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
      status: "Processing",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      hasPreorder: orderItems.some((item) => item.isPreorder),
      hasBackorder: orderItems.some((item) => item.isBackorder),
    };

    orders.unshift(order);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();

    await writeData("products", products);
    await writeData("orders", orders);
    await writeData("carts", carts);

    return NextResponse.json(order, { status: 201 });
  });
}