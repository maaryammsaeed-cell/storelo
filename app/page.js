// app/page.js
import { Suspense } from "react";
import { connection } from "next/server";
import Landingnavbar from "@/components/Landingnavbar";
import Landingherosec from "@/components/Landingherosec";
import ProductSection from "@/components/ProductSection";
import ServicesSection from "@/components/ServicesSection";
import LandingFooter from "@/components/LandingFooter";
import { readData } from "@/lib/db";
import { getSettings } from "@/lib/settings";   // 👈 NAYA
import { demoProducts } from "@/data/products";

// Ye page settings ko database se laata hai, is liye static prerender nahi ho
// sakta. instant = false Next ko batata hai ke ye blocking route hai.
export const instant = false;

async function getProducts() {
  try {
    // Yeh data/db/products.json file ko padhega jo Dashboard ne save ki hai
    const products = await readData("products");

    // React key ke liye _id aur id dono ko handle karta hai
    return products.map((product) => ({
      ...product,
      _id: product._id || product.id,
    }));
  } catch (error) {
    console.error("Products read karne me masla:", error.message);
    return [];
  }
}

// DB wala kaam alag component me hai taake hero foran load ho jaye
async function ProductsFromDatabase({ currency }) {
  const products = await getProducts();
  return (
    <ProductSection
      products={products.length > 0 ? products : demoProducts}
      currency={currency}
    />
  );
}

export default async function Home() {
  // 👇 2 nayi lines — har request par fresh settings
  await connection();
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* 👇 props add hue */}
      <Landingnavbar storeName={settings.storeName} logo={settings.logo} />

      <main className="flex flex-1 flex-col">
        {/* 👇 props add hue */}
        <Landingherosec hero={settings.hero} />

        <Suspense
          fallback={
            <ProductSection products={demoProducts} currency={settings.currency} />
          }
        >
          <ProductsFromDatabase currency={settings.currency} />
        </Suspense>
        <ServicesSection />

        {/* 👇 props add hue */}
        <LandingFooter footer={settings.footer} />
      </main>
    </div>
  );
}