import { NextResponse, connection } from "next/server";
import { getDemoStoreData } from "@/lib/demo-api";

// Fallback customers data in case external API or internet is unreachable
const fallbackCustomers = [
  {
    id: 1,
    name: { firstname: "Sophia", lastname: "Anderson" },
    email: "sophia.anderson@example.com",
    username: "sophia_a",
    phone: "+1 (555) 234-8901",
    address: { city: "New York", street: "452 5th Ave", number: 12, zipcode: "10018" },
    status: "VIP",
    ordersCount: 8,
    totalSpent: 1240.5,
    joinedDate: "2024-01-15",
  },
  {
    id: 2,
    name: { firstname: "Liam", lastname: "Mitchell" },
    email: "liam.m@example.com",
    username: "liam_m",
    phone: "+1 (555) 456-1122",
    address: { city: "Los Angeles", street: "820 Sunset Blvd", number: 405, zipcode: "90028" },
    status: "Active",
    ordersCount: 4,
    totalSpent: 480.0,
    joinedDate: "2024-02-10",
  },
  {
    id: 3,
    name: { firstname: "Emma", lastname: "Watson" },
    email: "emma.watson@example.com",
    username: "emma_w",
    phone: "+1 (555) 789-3344",
    address: { city: "Chicago", street: "330 N Wabash Ave", number: 88, zipcode: "60611" },
    status: "Active",
    ordersCount: 6,
    totalSpent: 790.0,
    joinedDate: "2024-03-01",
  },
  {
    id: 4,
    name: { firstname: "Noah", lastname: "Reynolds" },
    email: "noah.reynolds@example.com",
    username: "noah_r",
    phone: "+1 (555) 678-9900",
    address: { city: "Miami", street: "1100 Biscayne Blvd", number: 201, zipcode: "33132" },
    status: "VIP",
    ordersCount: 11,
    totalSpent: 2150.0,
    joinedDate: "2023-11-20",
  },
  {
    id: 5,
    name: { firstname: "Olivia", lastname: "Taylor" },
    email: "olivia.t@example.com",
    username: "olivia_t",
    phone: "+1 (555) 345-6712",
    address: { city: "Seattle", street: "600 Pine St", number: 14, zipcode: "98101" },
    status: "Active",
    ordersCount: 3,
    totalSpent: 310.0,
    joinedDate: "2024-03-18",
  },
  {
    id: 6,
    name: { firstname: "Ethan", lastname: "Davis" },
    email: "ethan.davis@example.com",
    username: "ethan_d",
    phone: "+1 (555) 901-2384",
    address: { city: "Dallas", street: "2200 Ross Ave", number: 50, zipcode: "75201" },
    status: "Inactive",
    ordersCount: 1,
    totalSpent: 95.0,
    joinedDate: "2023-10-05",
  },
  {
    id: 7,
    name: { firstname: "Isabella", lastname: "Miller" },
    email: "isabella.m@example.com",
    username: "bella_m",
    phone: "+1 (555) 432-8765",
    address: { city: "San Francisco", street: "888 Howard St", number: 300, zipcode: "94103" },
    status: "Active",
    ordersCount: 5,
    totalSpent: 620.0,
    joinedDate: "2024-02-28",
  },
  {
    id: 8,
    name: { firstname: "Alexander", lastname: "Clark" },
    email: "alex.clark@example.com",
    username: "alex_c",
    phone: "+1 (555) 654-3210",
    address: { city: "Austin", street: "500 W 2nd St", number: 18, zipcode: "78701" },
    status: "VIP",
    ordersCount: 9,
    totalSpent: 1680.0,
    joinedDate: "2023-12-14",
  },
  {
    id: 9,
    name: { firstname: "Mia", lastname: "Rodriguez" },
    email: "mia.r@example.com",
    username: "mia_rod",
    phone: "+1 (555) 876-5432",
    address: { city: "Boston", street: "100 Federal St", number: 40, zipcode: "02110" },
    status: "Active",
    ordersCount: 2,
    totalSpent: 220.0,
    joinedDate: "2024-04-02",
  },
  {
    id: 10,
    name: { firstname: "James", lastname: "Wilson" },
    email: "james.wilson@example.com",
    username: "james_w",
    phone: "+1 (555) 321-7654",
    address: { city: "Denver", street: "1700 Lincoln St", number: 22, zipcode: "80203" },
    status: "Inactive",
    ordersCount: 0,
    totalSpent: 0.0,
    joinedDate: "2024-04-10",
  },
];

export async function GET() {
  await connection();

  try {
    const { products, carts, users } = await getDemoStoreData();

    if (users.length > 0) {
      // Har customer ke asli orders aur spending carts se calculate karte hain.
      const enriched = users.map((user, idx) => {
        const userCarts = carts.filter((cart) => cart.userId === user.id);

        const totalSpent = userCarts.reduce((sum, cart) => {
          return (
            sum +
            cart.products.reduce((cartSum, item) => {
              const product = products.find((p) => p.id === item.productId);
              return cartSum + (product ? product.price * item.quantity : 0);
            }, 0)
          );
        }, 0);

        const ordersCount = userCarts.length;
        const status =
          totalSpent >= 500 ? "VIP" : ordersCount > 0 ? "Active" : "Inactive";

        const joinedDate = new Date(
          Date.now() - (idx + 1) * 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10);

        return {
          ...user,
          ordersCount,
          totalSpent: Number(totalSpent.toFixed(2)),
          status,
          joinedDate,
        };
      });

      return NextResponse.json(enriched);
    }
  } catch {
    // Return reliable fallback data if external API fails
  }

  return NextResponse.json(fallbackCustomers);
}
