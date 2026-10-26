import { NextResponse, connection } from "next/server";
import { getDemoStoreData } from "@/lib/demo-api";

// Fallback orders in case external API or internet is unreachable
const fallbackOrders = [
  {
    id: 101,
    orderNumber: "ORD-9201",
    date: "2024-04-14T10:30:00.000Z",
    customer: {
      name: "Sophia Anderson",
      email: "sophia.anderson@example.com",
      avatar: "SA",
    },
    itemsCount: 3,
    itemsSummary: "Unisex T-Shirt, Canvas Tote Bag, Satin Dress",
    totalAmount: 315.0,
    status: "Delivered",
    paymentMethod: "Credit Card (Visa)",
    paymentStatus: "Paid",
  },
  {
    id: 102,
    orderNumber: "ORD-9202",
    date: "2024-04-15T14:15:00.000Z",
    customer: {
      name: "Liam Mitchell",
      email: "liam.m@example.com",
      avatar: "LM",
    },
    itemsCount: 2,
    itemsSummary: "Hoodie, Joggers / Sweatpants",
    totalAmount: 225.0,
    status: "Shipped",
    paymentMethod: "Apple Pay",
    paymentStatus: "Paid",
  },
  {
    id: 103,
    orderNumber: "ORD-9203",
    date: "2024-04-16T09:20:00.000Z",
    customer: {
      name: "Emma Watson",
      email: "emma.watson@example.com",
      avatar: "EW",
    },
    itemsCount: 4,
    itemsSummary: "Straight Leg Jeans, Denim Jacket, Polo Shirt",
    totalAmount: 405.0,
    status: "Processing",
    paymentMethod: "PayPal",
    paymentStatus: "Paid",
  },
  {
    id: 104,
    orderNumber: "ORD-9204",
    date: "2024-04-16T16:45:00.000Z",
    customer: {
      name: "Noah Reynolds",
      email: "noah.reynolds@example.com",
      avatar: "NR",
    },
    itemsCount: 1,
    itemsSummary: "Denim Jacket (Navy / Medium)",
    totalAmount: 160.0,
    status: "Delivered",
    paymentMethod: "Credit Card (Mastercard)",
    paymentStatus: "Paid",
  },
  {
    id: 105,
    orderNumber: "ORD-9205",
    date: "2024-04-17T11:10:00.000Z",
    customer: {
      name: "Olivia Taylor",
      email: "olivia.t@example.com",
      avatar: "OT",
    },
    itemsCount: 2,
    itemsSummary: "Satin Slip Dress, Tote Bag",
    totalAmount: 240.0,
    status: "Processing",
    paymentMethod: "Credit Card (Visa)",
    paymentStatus: "Paid",
  },
  {
    id: 106,
    orderNumber: "ORD-9206",
    date: "2024-04-17T18:05:00.000Z",
    customer: {
      name: "Ethan Davis",
      email: "ethan.davis@example.com",
      avatar: "ED",
    },
    itemsCount: 1,
    itemsSummary: "Polo Shirt (White / Large)",
    totalAmount: 75.0,
    status: "Cancelled",
    paymentMethod: "Credit Card (Visa)",
    paymentStatus: "Refunded",
  },
  {
    id: 107,
    orderNumber: "ORD-9207",
    date: "2024-04-18T08:30:00.000Z",
    customer: {
      name: "Isabella Miller",
      email: "isabella.m@example.com",
      avatar: "IM",
    },
    itemsCount: 3,
    itemsSummary: "Unisex T-Shirt, Straight Leg Jeans, Hoodie",
    totalAmount: 310.0,
    status: "Shipped",
    paymentMethod: "Apple Pay",
    paymentStatus: "Paid",
  },
  {
    id: 108,
    orderNumber: "ORD-9208",
    date: "2024-04-18T13:40:00.000Z",
    customer: {
      name: "Alexander Clark",
      email: "alex.clark@example.com",
      avatar: "AC",
    },
    itemsCount: 5,
    itemsSummary: "Denim Jacket, Joggers, Polo Shirt, T-Shirt",
    totalAmount: 520.0,
    status: "Delivered",
    paymentMethod: "PayPal",
    paymentStatus: "Paid",
  },
];

export async function GET() {
  await connection();

  try {
    const { products, carts, users } = await getDemoStoreData();

    if (carts.length > 0) {

      const statuses = ["Delivered", "Shipped", "Processing", "Delivered", "Delivered", "Processing", "Cancelled"];

      const enrichedOrders = carts.map((cart, idx) => {
        const user = users.find((u) => u.id === cart.userId) || users[idx % users.length];
        const fullName = user?.name
          ? `${user.name.firstname} ${user.name.lastname}`
          : `Customer #${cart.userId}`;
        const initials = user?.name
          ? `${user.name.firstname[0]}${user.name.lastname[0]}`.toUpperCase()
          : "CU";

        const items = cart.products || [];
        const itemsCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

        let totalAmount = items.reduce((sum, item) => {
          const product = products.find((p) => p.id === item.productId);
          return sum + (product ? product.price * item.quantity : 45.0 * item.quantity);
        }, 0);

        if (totalAmount === 0) totalAmount = 149.99 + idx * 30;

        const status = statuses[idx % statuses.length];

        return {
          id: cart.id,
          orderNumber: `ORD-${9100 + cart.id}`,
          date: cart.date || new Date().toISOString(),
          customer: {
            name: fullName,
            email: user?.email || `customer${cart.userId}@storelo.com`,
            avatar: initials,
          },
          itemsCount,
          itemsSummary: `${itemsCount} item${itemsCount > 1 ? "s" : ""} in package`,
          totalAmount: Number(totalAmount.toFixed(2)),
          status,
          paymentMethod: idx % 3 === 0 ? "Apple Pay" : idx % 2 === 0 ? "PayPal" : "Credit Card",
          paymentStatus: status === "Cancelled" ? "Refunded" : "Paid",
        };
      });

      if (enrichedOrders.length > 0) {
        return NextResponse.json(enrichedOrders);
      }
    }
  } catch {
    // Return reliable fallback data
  }

  return NextResponse.json(fallbackOrders);
}
