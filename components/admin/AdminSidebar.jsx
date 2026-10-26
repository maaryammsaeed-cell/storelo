"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const links = [
  { label: "Dashboard Overview", href: "/admin", icon: "grid" },
  { label: "Products", href: "/admin/products", icon: "box" },
  { label: "Orders", href: "/admin/orders", icon: "receipt" },
  { label: "Customers", href: "/admin/customers", icon: "users" },
  { label: "Notifications", href: "/admin/notifications", icon: "chart" },
];

function NavIcon({ name }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "h-5 w-5 shrink-0",
    "aria-hidden": "true",
  };

  if (name === "grid") {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg {...props}>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    );
  }

  if (name === "receipt") {
    return (
      <svg {...props}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.5 20a5.5 5.5 0 0 1 5.5-5" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
    </svg>
  );
}

export default function AdminSidebar({ email }) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-pink-100 bg-white/90 md:flex md:min-h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
      <div className="px-6 py-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-pink-400">
          Storelo
        </p>
        <h1 className="mt-2 font-playfair text-2xl text-[#831843]">
          Admin Panel
        </h1>
        <p className="mt-1 truncate text-xs text-[#9d6b82]">{email}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                active
                  ? "bg-pink-100 font-medium text-[#9d174d]"
                  : "text-[#7c4a5e] hover:bg-pink-50 hover:text-[#9d174d]"
              }`}
            >
              <NavIcon name={link.icon} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-pink-100 p-4 md:mt-auto">
        <LogoutButton />
      </div>
    </aside>
  );
}