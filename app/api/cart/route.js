import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { readData, writeData } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getStockState } from "@/lib/product";

// Guest customer ki pehchan — httpOnly cookie
const COOKIE_NAME = "cart_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 din
const MAX_QUANTITY = 99;

function nowISO() {
  return new Date().toISOString();
}

// Cookie banao / set karo
function setCartCookie(response, cartId) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: cartId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

// Cart ke items me products.json se asli data + stock state milao
async function hydrate(cart, products, settings) {
  const list = products ?? (await readData("products"));
  const byId = new Map(list.map((product) => [product.id, product]));

  const items = cart.items
    .map((item) => {
      const product = byId.get(item.productId);
      if (!product) return null; // product delete ho gaya ho to chhor do

      // Har item ka stock faisla yahin hota hai
      const state = getStockState(product, settings);

      return {
        id: product.id,
        _id: product.id,
        title: product.title,
        price: Number(product.price) || 0,
        image: product.image || "",
        quantity: item.quantity,

        // Cart page aur checkout page ko ye fields chahiye
        stock: state.stock,
        status: state.status,
        state: state.state,
        label: state.label,
        message: state.message,
        canAddToCart: state.canAddToCart,
        isPreorder: state.isPreorder,
        isBackorder: state.isBackorder,
      };
    })
    .filter(Boolean);

  return { id: cart.id, items, updatedAt: cart.updatedAt };
}

// =====================================================
// GET /api/cart → is customer ka cart
// =====================================================
export async function GET() {
  await connection();

  const settings = await getSettings();

  const cookieStore = await cookies();
  let cartId = cookieStore.get(COOKIE_NAME)?.value;

  // Pehli dafa: id bana do, taake POST isi id par jaye
  if (!cartId) {
    cartId = crypto.randomUUID();
    return setCartCookie(
      NextResponse.json({ id: cartId, items: [] }),
      cartId
    );
  }

  const carts = await readData("carts");
  const cart = carts.find((entry) => entry.id === cartId);

  if (!cart) return NextResponse.json({ id: cartId, items: [] });

  return NextResponse.json(await hydrate(cart, undefined, settings));
}

// =====================================================
// POST /api/cart → ek product add karo
// Body: { productId: "p1", quantity: 1 }
// =====================================================
export async function POST(request) {
  await connection();

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId || "");
  const quantity = Math.floor(Number(body?.quantity));

  // 1. Basic validation
  if (!productId) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json(
      {
        error: "INVALID_QUANTITY",
        message: "Quantity must be 1 or greater.",
      },
      { status: 400 }
    );
  }

  // 2. Product DB me hai ya nahi
  const products = await readData("products");
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    return NextResponse.json(
      { error: "PRODUCT_NOT_FOUND" },
      { status: 404 }
    );
  }

  // 3. Stock/status check — asli validation
  const settings = await getSettings();
  const state = getStockState(product, settings);

  if (!state.canAddToCart) {
    return NextResponse.json(
      {
        error: state.state.toUpperCase(),
        message: state.message,
      },
      { status: 409 }
    );
  }

  // 4. Cart dhundo ya naya banao
  const cookieStore = await cookies();
  let cartId = cookieStore.get(COOKIE_NAME)?.value;
  const isNewCart = !cartId;

  if (!cartId) cartId = crypto.randomUUID();

  const carts = await readData("carts");
  let cart = carts.find((entry) => entry.id === cartId);

  if (!cart) {
    cart = {
      id: cartId,
      items: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    carts.push(cart);
  }

  // 5. Quantity ki hadd
  const existing = cart.items.find((item) => item.productId === productId);
  const nextQuantity = (existing?.quantity || 0) + quantity;

  const maxAllowed =
    state.isPreorder || state.isBackorder
      ? MAX_QUANTITY
      : Number(state.stock);

  if (nextQuantity > maxAllowed) {
    return NextResponse.json(
      {
        error: "STOCK_LIMIT",
        available: state.stock,
        message: `Only ${state.stock} item(s) available`,
      },
      { status: 409 }
    );
  }

  // 6. Add ya update
  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  cart.updatedAt = nowISO();
  await writeData("carts", carts);

  const response = NextResponse.json(
    await hydrate(cart, products, settings)
  );
  return isNewCart ? setCartCookie(response, cartId) : response;
}

// =====================================================
// PATCH /api/cart → quantity badlo
// Body: { productId: "p1", delta: 1 } ya { productId: "p1", quantity: 3 }
// =====================================================
export async function PATCH(request) {
  await connection();

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId || "");

  if (!productId) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const settings = await getSettings();
  const products = await readData("products");
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    return NextResponse.json(
      { error: "PRODUCT_NOT_FOUND" },
      { status: 404 }
    );
  }

  const state = getStockState(product, settings);

  const cookieStore = await cookies();
  const cartId = cookieStore.get(COOKIE_NAME)?.value;
  if (!cartId) return NextResponse.json({ items: [] });

  const carts = await readData("carts");
  const cart = carts.find((entry) => entry.id === cartId);
  if (!cart) return NextResponse.json({ items: [] });

  const item = cart.items.find((entry) => entry.productId === productId);
  if (!item) {
    return NextResponse.json(
      await hydrate(cart, products, settings)
    );
  }

  const quantity = Number(body?.quantity);
  const delta = Number(body?.delta);

  let nextQuantity;

  if (Number.isFinite(quantity)) {
    nextQuantity = Math.floor(quantity);
  } else if (Number.isFinite(delta)) {
    nextQuantity = item.quantity + Math.floor(delta);
  } else {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  // Sirf BARHANE par check karo.
  // Ghatane/remove karne par customer ko rokna nahi chahiye.
  const increasing = nextQuantity > item.quantity;

  if (increasing) {
    if (!state.canAddToCart) {
      return NextResponse.json(
        {
          error: state.state.toUpperCase(),
          message: state.message,
        },
        { status: 409 }
      );
    }

    const maxAllowed =
      state.isPreorder || state.isBackorder
        ? MAX_QUANTITY
        : Number(state.stock);

    if (nextQuantity > maxAllowed) {
      return NextResponse.json(
        {
          error: "STOCK_LIMIT",
          available: state.stock,
          message: `Only ${state.stock} item(s) available`,
        },
        { status: 409 }
      );
    }
  }

  if (nextQuantity <= 0) {
    cart.items = cart.items.filter(
      (entry) => entry.productId !== productId
    );
  } else {
    item.quantity = Math.min(nextQuantity, MAX_QUANTITY);
  }

  cart.updatedAt = nowISO();
  await writeData("carts", carts);

  return NextResponse.json(
    await hydrate(cart, products, settings)
  );
}

// =====================================================
// DELETE /api/cart?productId=p1 → ek item hatao
// DELETE /api/cart              → poora cart khali karo
// =====================================================
export async function DELETE(request) {
  await connection();

  const settings = await getSettings();
  const productId = new URL(request.url).searchParams.get("productId");

  const cookieStore = await cookies();
  const cartId = cookieStore.get(COOKIE_NAME)?.value;
  if (!cartId) return NextResponse.json({ items: [] });

  const carts = await readData("carts");
  const cart = carts.find((entry) => entry.id === cartId);
  if (!cart) return NextResponse.json({ items: [] });

  cart.items = productId
    ? cart.items.filter((entry) => entry.productId !== productId)
    : [];

  cart.updatedAt = nowISO();
  await writeData("carts", carts);

  return NextResponse.json(
    await hydrate(cart, undefined, settings)
  );
}