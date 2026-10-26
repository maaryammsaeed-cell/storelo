// Demo products.
// Jab tak MongoDB me products add nahi hote, landing page ye products dikhata hai.
// Har product ke fields lib/models/Product.js ke schema se match karte hain.
//
// APNI IMAGE LAGANE KA TAREEQA:
// 1. Photo ko public/images/products/ folder me copy karo (naam simple rakho, jaise tshirt.jpg).
// 2. Neeche us product ke image field me sirf ye path likho: "/images/products/tshirt.jpg"
//    (public/ likhne ki zaroorat nahi — path public folder ke andar se shuru hota hai)
// 3. File save karo aur browser me Ctrl + F5 dabao.
export const demoProducts = [
  {
    _id: "demo-1",
    title: "Unisex Basic T-Shirt",
    price: 75,
    oldPrice: 95,
    image: "/images/products/tshirt.jpg",
    category: "Men",
    colors: ["#1f2119", "#e8e2d6", "#8f9276"],
    rating: 4.7,
    reviews: 128,
  },
  {
    _id: "demo-2",
    title: "Hoodie",
    price: 125,
    image: "/images/products/hoodie.jpg",
    category: "Men",
    colors: ["#6b6e5b", "#1f2119", "#d9d2c6"],
    rating: 4.8,
    reviews: 214,
  },
  {
    _id: "demo-3",
    title: "Polo Shirt",
    price: 75,
    image: "/images/products/polo.jpg",
    category: "Men",
    colors: ["#f4f1e9", "#a8b0bd", "#1f2119"],
    rating: 4.6,
    reviews: 96,
  },
  {
    _id: "demo-4",
    title: "Joggers / Sweatpants",
    price: 100,
    image: "/images/products/joggers.jpg",
    category: "Men",
    colors: ["#9a9c8a", "#1f2119", "#6b6e5b"],
    rating: 4.4,
    reviews: 63,
  },
  {
    _id: "demo-5",
    title: "Satin Slip Dress",
    price: 180,
    image: "/images/products/dress.jpg",
    category: "Women",
    colors: ["#e9e2d4", "#b7a58c", "#1f2119"],
    rating: 4.9,
    reviews: 187,
  },
  {
    _id: "demo-6",
    title: "Straight Leg Jeans",
    price: 110,
    image: "/images/products/jeans.jpg",
    category: "Women",
    colors: ["#73839a", "#3f4c5c", "#a9b4c2"],
    rating: 4.5,
    reviews: 142,
  },
  {
    _id: "demo-7",
    title: "Canvas Tote Bag",
    price: 60,
    oldPrice: 80,
    image: "/images/products/tote-bag.jpg",
    category: "Women",
    colors: ["#d2c09c", "#1f2119", "#8f9276"],
    rating: 4.7,
    reviews: 311,
  },
  {
    _id: "demo-8",
    title: "Denim Jacket",
    price: 160,
    image: "/images/products/denim-jacket.jpg",
    category: "Women",
    colors: ["#647a91", "#3f4c5c", "#d7dde5"],
    rating: 4.8,
    reviews: 175,
  },
];
