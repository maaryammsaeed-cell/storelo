import { notFound } from "next/navigation";
import { getProduct } from "@/lib/repo/products";
import { getSettings } from "@/lib/settings";
import ProductDetails from "@/components/ProductDetails";

export const instant = false;

export default async function ProductPage({ params }) {
  const { id } = await params;

  let product;
  try {
    product = await getProduct(id);
  } catch {
    return (
      <p className="px-5 py-16 text-center text-sm text-[#b3453b]">
        Stock information is unavailable. Please try again.
      </p>
    );
  }

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