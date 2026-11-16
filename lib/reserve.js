import { getCart, setReservation, clearReservation } from "@/lib/repo/carts";
import { getProduct } from "@/lib/repo/products";
import { holdItem, releaseItem } from "@/lib/stock";
import { listExpiredReservations } from "@/lib/repo/carts";

const RESERVE_MS = 5 * 60 * 1000;

// 1. Expired reservations → stock wapas
export async function releaseExpiredReservations() {
  const expired = await listExpiredReservations();

  for (const { id, reservation } of expired) {
    for (const item of reservation.items || []) {
      if (item.held) await releaseItem(item.productId, item.quantity);
    }
    await clearReservation(id);
  }
}

// 2. Checkout page: 5 minute ke liye stock hold
export async function reserveCart(cartId, selectedProductIds = null) {
  const cart = await getCart(cartId);
  if (!cart || cart.items.length === 0) return { error: "CART_EMPTY" };

  const selected = selectedProductIds?.length
    ? cart.items.filter((i) => selectedProductIds.includes(String(i.productId)))
    : cart.items;

  if (selected.length === 0) return { error: "CART_EMPTY" };

  // purani reservation release karo
  if (cart.reservation) {
    for (const item of cart.reservation.items || []) {
      if (item.held) await releaseItem(item.productId, item.quantity);
    }
    await clearReservation(cartId);
  }

  const items = [];
  const held = [];   // rollback ke liye yaad rakho

  try {
    for (const item of selected) {
      const product = await getProduct(String(item.productId));
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (["discontinued", "inactive"].includes(product.status)) {
        throw new Error("PRODUCT_UNAVAILABLE");
      }

      const special =
        product.status === "preorder" ||
        (Number(product.stock) === 0 && product.allowBackorder === true);

      if (!special) {
        const updated = await holdItem(item.productId, item.quantity);
        if (!updated) throw new Error("STOCK_LIMIT");
        held.push(item);
      }

      items.push({
        productId: item.productId,
        quantity: item.quantity,
        held: !special,
      });
    }
  } catch (error) {
    // adhoori hold wapas
    for (const item of held) {
      await releaseItem(item.productId, item.quantity);
    }
    return { error: error.message.split(":")[0] };
  }

  const reservation = {
    expiresAt: new Date(Date.now() + RESERVE_MS),
    items,
  };
  await setReservation(cartId, reservation);

  return { expiresAt: reservation.expiresAt.toISOString() };
}

// 3. Buy-now / cancel: hold wapas
export async function cancelCartReservation(cartId) {
  const cart = await getCart(cartId);
  if (!cart?.reservation) return;

  for (const item of cart.reservation.items || []) {
    if (item.held) await releaseItem(item.productId, item.quantity);
  }
  await clearReservation(cartId);
}