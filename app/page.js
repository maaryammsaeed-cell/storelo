// app/page.js
import { Suspense } from "react";
import { connection } from "next/server";
import Landingnavbar from "@/components/Landingnavbar";
import Landingherosec from "@/components/Landingherosec";
import ProductSection from "@/components/ProductSection";
import ServicesSection from "@/components/ServicesSection";
import LandingFooter from "@/components/LandingFooter";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { demoProducts } from "@/data/products";

// MongoDB se products laata hai.
// DB band ho ya khali ho to khali array return karta hai (page crash nahi hota).
async function getProducts() {
  // Ye line Next ko batati hai ke ye data har request par chahiye
  // (warna build ke waqt prerender koshish me "new Date()" error aata hai).
  await connection();

  try {
    await connectDB();
    const products = await Product.find({}).lean();

    // _id ko string me badalna zaroori hai (client component ko bhejne ke liye)
    return products.map((product) => ({
      ...product,
      _id: product._id.toString(),
    }));
  } catch (error) {
    console.error("MongoDB se products laane me masla:", error.message);
    return [];
  }
}

// DB wala kaam alag component me hai taake hero foran (static) load ho jaye
async function ProductsFromDatabase() {
  const products = await getProducts();
  return (
    <ProductSection products={products.length > 0 ? products : demoProducts} />
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Landingnavbar />

      <main className="flex flex-1 flex-col">
        <Landingherosec />

        {/* DB se aane wale products stream hote hain.
            Jab tak load ho rahe hon, demo products dikhte hain. */}
        <Suspense fallback={<ProductSection products={demoProducts} />}>
          <ProductsFromDatabase />
        </Suspense>

        {/* Products ke neechay 4 + 4 services */}
        <ServicesSection />

        {/* Closing CTA */}
        <LandingFooter/>
      </main>
    </div>
  );
}
