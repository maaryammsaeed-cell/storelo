"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-medium text-[#9d174d] transition hover:bg-pink-100"
    >
      Logout
    </button>
  );
}