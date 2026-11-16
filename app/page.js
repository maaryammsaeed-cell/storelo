// app/page.js
import { Suspense } from "react";
import { connection } from "next/server";
import Landingnavbar from "@/components/Landingnavbar";
import Landingherosec from "@/components/Landingherosec";
import ProductSection from "@/components/ProductSection";
import ServicesSection from "@/components/ServicesSection";
import LandingFooter from "@/components/LandingFooter";
import { readData } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { releaseExpiredReservations } from "@/lib/reserve";
import LandingTabBar from "@/components/LandingTabBar";

export const instant = false;

async function getProducts() {

  const products = (await readData("products")).filter((p) => !p.deletedAt);
  try {
    const products = await readData("products");

    return {
      products: products.map((product) => ({
        ...product,
        _id: product._id || product.id,
      })),
      error: "",
    };
  } catch (error) {
    console.error("Products read error:", error.message);
    return {
      products: [],
      error: "Stock information could not be loaded.",
    };
  }
}

async function ProductsFromDatabase({
  currency,
  lowStockLimit,
  allowBackorder,
}) {
  const { products, error } = await getProducts();

  if (error) {
    return (
      <p className="px-5 py-16 text-center text-sm text-[#b3453b]">
        {error} Please refresh.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="px-5 py-16 text-center text-sm text-[#8b8679]">
        No products available.
      </p>
    );
  }

  return (
    <ProductSection
      products={products}
      currency={currency}
      lowStockLimit={lowStockLimit}
      allowBackorder={allowBackorder}
    />
  );
}

export default async function Home() {
  await connection();

  // Expired stock reservations release karo — phir fresh stock padho
  await releaseExpiredReservations();

  const settings = await getSettings();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#F3EADF] font-sans  pb-24">
      {/* Hero jaisa soft glow — poore page par */}
      <div className="pointer-events-none absolute -left-40 top-[38%] h-[520px] w-[520px] rounded-full bg-[#EAD6D9]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-[62%] h-[480px] w-[480px] rounded-full bg-[#E3D0C9]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-[#EAD6D9]/30 blur-3xl" />

      <Landingnavbar storeName={settings.storeName} logo={settings.logo} />

      <main className="relative z-10 flex flex-1 flex-col">
        <Landingherosec hero={settings.hero} />

        <Suspense
          fallback={
            <p className="px-5 py-16 text-center text-sm text-[#8b8679]">
              Loading products...
            </p>
          }
        >
          <ProductsFromDatabase
            currency={settings.currency}
            lowStockLimit={settings.lowStockLimit}
            allowBackorder={settings.allowBackorder}
          />
        </Suspense>

        <ServicesSection />
        <LandingFooter footer={settings.footer} />
      </main>

      <LandingTabBar />
    </div>
  );
}
