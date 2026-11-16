import { connection } from "next/server";
import { getSettings } from "@/lib/settings";
import LoginForm from "@/components/LoginForm";

// Settings DB se aati hain — is liye page ko har request par fresh chalna hai
export const instant = false;

// Ye server component hai — sirf settings padhta hai aur form ko props deta hai.
export default async function LoginPage() {
  await connection(); // har request par fresh settings
  const settings = await getSettings();

  return <LoginForm storeName={settings.storeName} logo={settings.logo} />;
}
