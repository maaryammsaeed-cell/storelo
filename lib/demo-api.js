// DummyJSON demo API.
// FakeStore API kuch networks par block hoti hai, is liye hum DummyJSON use karte hain.
// Ye helper data ko FakeStore jaisi shape mein badal deta hai,
// taake baaki pages bina badle kaam karein.

const BASE_URL = "https://dummyjson.com";

async function fetchJson(path) {
  const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Demo API request failed (${response.status})`);
  }

  return response.json();
}

export async function getDemoStoreData() {
  const [productsData, cartsData, usersData] = await Promise.all([
    fetchJson("/products?limit=0"),
    fetchJson("/carts?limit=0"),
    fetchJson("/users?limit=0"),
  ]);

  const products = (productsData.products || []).map((product) => ({
    id: product.id,
    title: product.title,
    price: Number(product.price || 0),
    description: product.description || "",
    category: product.category || "General",
    image: product.thumbnail || "",
    rating: {
      rate: Number(product.rating ?? 4.5),
      count: Array.isArray(product.reviews) ? product.reviews.length : 30,
    },
  }));

  const now = Date.now();

  const carts = (cartsData.carts || []).map((cart, index) => ({
    id: cart.id,
    userId: cart.userId,
    // DummyJSON carts mein date nahi hoti, is liye har cart ko
    // thora purana date de dete hain (latest pehle).
    date: new Date(now - index * 6 * 60 * 60 * 1000).toISOString(),
    products: (cart.products || []).map((item) => ({
      productId: item.id,
      quantity: Number(item.quantity || 1),
    })),
  }));

  const users = (usersData.users || []).map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    name: {
      firstname: user.firstName || "Storelo",
      lastname: user.lastName || "Customer",
    },
    address: {
      city: user.address?.city || "Unknown",
      street: user.address?.address || "",
      number: 0,
      zipcode: user.address?.postalCode || "",
    },
  }));

  return { products, carts, users };
}
