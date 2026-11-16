import { connection } from "next/server";
import { getSettings } from "@/lib/settings";
import Landingnavbar from "@/components/Landingnavbar";
import LandingTabBar from "@/components/LandingTabBar";

export const instant = false;

export default async function CartLayout({ children }) {
  await connection();
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfcf9] pb-24">
      <Landingnavbar storeName={settings.storeName} logo={settings.logo} />
      <main className="flex-1">{children}</main>

      <LandingTabBar />
    </div>
  );
}