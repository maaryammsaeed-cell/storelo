"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { label: "Dashboard Overview", href: "/admin", icon: "grid" },
  {
    label: "Products",
    icon: "box",
    baseHref: "/admin/products",
    subItems: [
      { label: "View", href: "/admin/products" },
      { label: "Manage", href: "/admin/products/manage" },
    ],
  },
  {
    label: "Inventory",
    icon: "layers",
    baseHref: "/admin/inventory",
    subItems: [
      { label: "View", href: "/admin/inventory" },
      { label: "Manage", href: "/admin/inventory/manage" },
    ],
  },
  {
    label: "Orders",
    icon: "receipt",
    baseHref: "/admin/orders",
    subItems: [
      { label: "View", href: "/admin/orders" },
      { label: "Manage", href: "/admin/orders/manage" },
    ],
  },
  {
    label: "Customers",
    icon: "users",
    baseHref: "/admin/customers",
    subItems: [
      { label: "View", href: "/admin/customers" },
      { label: "Manage", href: "/admin/customers/manage" },
    ],
  },
  { label: "Notifications", href: "/admin/notifications", icon: "chart" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
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

  if (name === "layers") {
    return (
      <svg {...props}>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
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

  if (name === "settings") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
    </svg>
  );
}

function ChevronIcon({ className, isOpen }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
        isOpen ? "rotate-180" : ""
      } ${className || ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function AdminSidebar({ email, storeName = "Storelo" }) {
  const pathname = usePathname();

  // Track which submenus are open
  const [openMenus, setOpenMenus] = useState({});

  // Automatically expand the submenu corresponding to current route
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const isCurrent =
          pathname === item.baseHref || pathname.startsWith(item.baseHref + "/");
        if (isCurrent) {
          setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

  function toggleMenu(label) {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  return (
    <aside className="w-full shrink-0 border-b border-pink-100 bg-white/90 md:flex md:min-h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
      <div className="px-6 py-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-pink-400">
          {storeName}
        </p>
        <h1 className="mt-2 font-playfair text-2xl text-[#831843]">
          Admin Panel
        </h1>
        <p className="mt-1 truncate text-xs text-[#9d6b82]">{email}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
        {navItems.map((item) => {
          // If this is a page with sub-items (Products, Inventory, Orders, Customers)
          if (item.subItems) {
            const isSectionActive =
              pathname === item.baseHref || pathname.startsWith(item.baseHref + "/");
            const isOpen = Boolean(openMenus[item.label]);

            return (
              <div key={item.label} className="flex flex-col shrink-0 md:shrink">
                <div
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition ${
                    isSectionActive
                      ? "bg-pink-100 font-medium text-[#9d174d]"
                      : "text-[#7c4a5e] hover:bg-pink-50 hover:text-[#9d174d]"
                  }`}
                >
                  {/* Clicking the main name navigates to the View page & opens the submenu */}
                  <Link
                    href={item.baseHref}
                    onClick={() => {
                      setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
                    }}
                    className="flex flex-1 items-center gap-3"
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>

                  {/* Toggle chevron button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMenu(item.label);
                    }}
                    aria-label={`Toggle ${item.label} submenu`}
                    className="p-1 text-[#9d6b82] transition hover:text-[#9d174d]"
                  >
                    <ChevronIcon isOpen={isOpen} />
                  </button>
                </div>

                {/* Submenu: View & Manage */}
                {isOpen && (
                  <div className="mt-1 flex flex-col space-y-1 pl-9 pr-2 pb-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition ${
                            isSubActive
                              ? "bg-pink-200/70 font-semibold text-[#831843]"
                              : "text-[#9d6b82] hover:bg-pink-50 hover:text-[#831843]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSubActive ? "bg-pink-600" : "bg-pink-300"
                            }`}
                          />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // For standard links without sub-items (Dashboard Overview, Notifications, Settings)
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                active
                  ? "bg-pink-100 font-medium text-[#9d174d]"
                  : "text-[#7c4a5e] hover:bg-pink-50 hover:text-[#9d174d]"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
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
