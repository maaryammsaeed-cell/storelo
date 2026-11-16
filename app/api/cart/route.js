import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { getSettings } from "@/lib/settings";
import { getStockState } from "@/lib/product";
import { getProduct, listProductsByIds } from "@/lib/repo/products";
import {
  getCart,
  getOrCreateCart,
  addItem,
  setItemQuantity,
  removeItem,
  clearCart,
} from "@/lib/repo/carts";

// Guest customer ki pehchan — httpOnly cookie
const COOKIE_NAME = "cart_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 din
const MAX_QUANTITY = 99;

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

// Cart ke items par Mongo products ka asli data + stock state milao
async function hydrate(cart, settings) {
  if (!cart) return { id: null, items: [] };

  const products = await listProductsByIds(cart.items.map((i) => i.productId));
  const byId = new Map(products.map((product) => [product.id, product]));

  const items = cart.items
    .map((item) => {
      const product = byId.get(String(item.productId));
      if (!product) return null; // product delete ho gaya ho to chhor do

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
  const currentId = cookieStore.get(COOKIE_NAME)?.value;

  // Purani UUID cookie ho to naya Mongo cart banega
  const cart = await getOrCreateCart(currentId);

  const response = NextResponse.json(await hydrate(cart, settings));

  // Cookie purani/galat thi → nayi id set karo
  if (currentId !== cart.id) setCartCookie(response, cart.id);

  return response;
}

// =====================================================
// POST /api/cart → ek product add karo
// Body: { productId: "690a...", quantity: 1 }
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

  // 2. Product Mongo me hai ya nahi
  const product = await getProduct(productId);

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
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
  const currentId = cookieStore.get(COOKIE_NAME)?.value;

  const cart = await getOrCreateCart(currentId);
  const isNewCart = currentId !== cart.id;

  // 5. Quantity ki hadd
  const existing = cart.items.find(
    (item) => String(item.productId) === productId
  );
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

  // 6. Add ya update (atomic $inc / $push)
  const finalQuantity = Math.min(nextQuantity, MAX_QUANTITY);

  const updated = existing
    ? await setItemQuantity(cart.id, productId, finalQuantity)
    : await addItem(cart.id, productId, finalQuantity);

  const response = NextResponse.json(await hydrate(updated, settings));

  return isNewCart ? setCartCookie(response, cart.id) : response;
}

// =====================================================
// PATCH /api/cart → quantity badlo
// Body: { productId, delta: 1 } ya { productId, quantity: 3 }
// =====================================================
export async function PATCH(request) {
  await connection();

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId || "");

  if (!productId) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const settings = await getSettings();
  const product = await getProduct(productId);

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }

  const state = getStockState(product, settings);

  const cookieStore = await cookies();
  const currentId = cookieStore.get(COOKIE_NAME)?.value;
  const cart = await getCart(currentId);

  if (!cart) return NextResponse.json({ items: [] });

  const item = cart.items.find(
    (entry) => String(entry.productId) === productId
  );

  if (!item) return NextResponse.json(await hydrate(cart, settings));

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

  // <= 0 → repo khud item hata dega
  const finalQuantity =
    nextQuantity <= 0 ? 0 : Math.min(nextQuantity, MAX_QUANTITY);

  const updated = await setItemQuantity(cart.id, productId, finalQuantity);

  return NextResponse.json(await hydrate(updated || cart, settings));
}

// =====================================================
// DELETE /api/cart?productId=690a... → ek item hatao
// DELETE /api/cart                    → poora cart khali karo
// =====================================================
export async function DELETE(request) {
  await connection();

  const settings = await getSettings();
  const rawProductId = new URL(request.url).searchParams.get("productId");

  const cookieStore = await cookies();
  const currentId = cookieStore.get(COOKIE_NAME)?.value;
  const cart = await getCart(currentId);

  if (!cart) return NextResponse.json({ items: [] });

  let updated;

  if (!rawProductId) {
    updated = await clearCart(cart.id);
  } else if (mongoose.isValidObjectId(rawProductId)) {
    updated = await removeItem(cart.id, rawProductId);
  } else {
    // Purani UUID id → Mongo cart me mojood hi nahi, kuch na karo
    updated = cart;
  }

  return NextResponse.json(await hydrate(updated || cart, settings));
}