// Stock ke sirf 4 kaam.
// Ye functions products array letay hain aur order ka stockState badaltay hain.
// Inko kabhi akela mat chalao — hamesha withDbLock ke andar chalao.

// Har item par kaam karo (preorder/backorder ka stock hold nahi hota)
function eachItem(products, order, change) {
  for (const item of order.items || []) {
    if (item.isPreorder || item.isBackorder) continue;

    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    change(product, Number(item.quantity) || 0);
  }
}

// 1. Stock ko side par rakho (available kam karo)
export function holdStock(products, order) {
  // Pehle se hold ya commit hai to dobara mat karo
  if (order.stockState === "held" || order.stockState === "committed") return;

  eachItem(products, order, (product, quantity) => {
    product.stock = Math.max(0, (Number(product.stock) || 0) - quantity);
  });

  order.stockState = "held";
}

// 2. Payment success — stock pakka karo (stock dobara kam NAHI karna)
export function commitStock(products, order) {
  if (order.stockState === "committed") return;
  if (order.stockState === "released" || order.stockState === "restocked") return;

  // Hold ke waqt stock pehle hi kam ho chuka hai.
  // Yahan sirf nishan lagana hai.
  order.stockState = "committed";
}

// 3. Payment fail / cancel / timeout — stock wapas karo
export function releaseStock(products, order) {
  // Sirf "held" stock wapas hota hai
  if (order.stockState !== "held") return;

  eachItem(products, order, (product, quantity) => {
    product.stock = (Number(product.stock) || 0) + quantity;
  });

  order.stockState = "released";
}

// 4. Refund ke baad item wapas aaya — tab stock wapas karo
export function restockOrder(products, order) {
  // Sirf committed order restock hota hai, aur sirf ek baar
  if (order.stockState !== "committed") return;

  eachItem(products, order, (product, quantity) => {
    product.stock = (Number(product.stock) || 0) + quantity;
  });

  order.stockState = "restocked";
  order.restockedAt = new Date().toISOString();
}
