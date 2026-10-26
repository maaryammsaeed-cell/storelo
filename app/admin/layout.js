import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const instant = false;

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const admin = token ? await verifyToken(token) : null;

  if (!admin) redirect("/login");

  return (
    <div className="min-h-screen bg-[#fdf2f8] text-[#3f1d2e] md:flex">
      <AdminSidebar email={admin.email} />
      <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}