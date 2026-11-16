import { readData, writeData, withDbLock } from "@/lib/db";

// 5 minutes (checkout page bhi 5 minute dikhata hai)
const RESERVE_MS = 5 * 60 * 1000;

function isActive(reservation) {
  return (
    Boolean(reservation) &&
    new Date(reservation.expiresAt).getTime() > Date.now()
  );
}

// Stock wapas karo
function giveBackStock(products, reservation) {
  for (const item of reservation.items || []) {
    if (!item.held) continue;

    const product = products.find((p) => p.id === item.productId);
    if (product) {
      product.stock =
        (Number(product.stock) || 0) + Number(item.quantity || 0);
    }
  }
}

// 1. Expired reservations release karo
export async function releaseExpiredReservations() {
  return withDbLock(async () => {
    const [carts, products] = await Promise.all([
      readData("carts"),
      readData("products"),
    ]);

    let changed = false;

    for (const cart of carts) {
      if (!cart.reservation) continue;
      if (isActive(cart.reservation)) continue;

      giveBackStock(products, cart.reservation);
      delete cart.reservation;
      cart.updatedAt = new Date().toISOString();
      changed = true;
    }

    if (!changed) return;

    await writeData("products", products);
    await writeData("carts", carts);
  });
}

// 2. Checkout ke liye stock hold karo
export async function reserveCart(cartId ,  selectedProductIds = null) {
  return withDbLock(async () => {
    const [carts, products] = await Promise.all([
      readData("carts"),
      readData("products"),
    ]);

    const cart = carts.find((c) => c.id === cartId);
    if (!cart || cart.items.length === 0) return { error: "CART_EMPTY" };
   // Sirf selected items reserve karo
    const selectedItems =
      selectedProductIds && selectedProductIds.length > 0
        ? cart.items.filter((item) =>
            selectedProductIds.includes(item.productId)
          )
        : cart.items;

    if (selectedItems.length === 0) return { error: "CART_EMPTY" };
    // Cart wahi hai aur timer chal raha hai? Wahi timer wapas do
    const sameItems =
      cart.reservation &&
      cart.reservation.items.length === selectedItems.length &&
       selectedItems.every((item) => {
        const r = cart.reservation.items.find(
          (x) => x.productId === item.productId
        );
        return r && r.quantity === item.quantity;
      });

    if (isActive(cart.reservation) && sameItems) {
      return { expiresAt: cart.reservation.expiresAt };
    }

    // Purani reservation release karo
    if (cart.reservation) {
      giveBackStock(products, cart.reservation);
      delete cart.reservation;
    }

    const items = [];

    // Pehle check karo
    for (const item of selectedItems) {
      const product = products.find(
        (p) => p.id === item.productId && !p.deletedAt
      );

      if (!product) return { error: "PRODUCT_NOT_FOUND" };

      if (product.status === "discontinued" || product.status === "inactive") {
        return { error: "PRODUCT_UNAVAILABLE" };
      }

      // Preorder aur backorder ka stock hold nahi hota
      const special =
        product.status === "preorder" ||
        (Number(product.stock) === 0 && product.allowBackorder === true);

      if (!special && Number(product.stock) < item.quantity) {
        return {
          error: "STOCK_LIMIT",
          message: `Only ${product.stock} item(s) left for ${product.title}.`,
        };
      }

      items.push({
        productId: item.productId,
        quantity: item.quantity,
        held: !special,
      });
    }

    // Ab stock kam karo
    for (const item of items) {
      if (!item.held) continue;

      const product = products.find((p) => p.id === item.productId);
      product.stock = Number(product.stock) - item.quantity;
    }

    cart.reservation = {
      expiresAt: new Date(Date.now() + RESERVE_MS).toISOString(),
      items,
    };
    cart.updatedAt = new Date().toISOString();

    await writeData("products", products);
    await writeData("carts", carts);

    return { expiresAt: cart.reservation.expiresAt };
  });
}

// 3. Reservation cancel karo aur stock wapas karo
export async function cancelCartReservation(cartId) {
  return withDbLock(async () => {
    const [carts, products] = await Promise.all([
      readData("carts"),
      readData("products"),
    ]);

    const cart = carts.find((c) => c.id === cartId);
    if (!cart || !cart.reservation) return;

    giveBackStock(products, cart.reservation);
    delete cart.reservation;
    cart.updatedAt = new Date().toISOString();

    await writeData("products", products);
    await writeData("carts", carts);
  });
}