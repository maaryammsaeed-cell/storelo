import { notFound } from "next/navigation";
import { readData } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import ProductDetails from "@/components/ProductDetails";

export const instant = false;

export default async function ProductPage({ params }) {
  const { id } = await params;

  let products;
  try {
    products = await readData("products");
  } catch {
    return (
      <p className="px-5 py-16 text-center text-sm text-[#b3453b]">
        Stock information is unavailable. Please try again.
      </p>
    );
  }

  const product = products.find((item) => item.id === id || item._id === id);
  if (!product) notFound();

  const settings = await getSettings();

  return (
    <ProductDetails
      product={product}
      currency={settings.currency}
      lowStockLimit={settings.lowStockLimit}
      allowBackorder={settings.allowBackorder}
    />
  );
}