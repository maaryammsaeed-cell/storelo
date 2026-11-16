"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/useCart";

// Footer ke tabs. Naya tab chahiye to yahan add karo.
const tabs = [
  {
    label: "Home",
    href: "/#home",
    match: ["/"],
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    label: "Messages",
    href: "/messages",
    match: ["/messages"],
    icon: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    ),
  },
  {
    label: "Cart",
    href: "/cart",
    match: ["/cart"],
    icon: (
      <>
        <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.2" />
        <circle cx="18" cy="20" r="1.2" />
      </>
    ),
  },
  {
    label: "Access",
    href: "/login",
    match: ["/login"],
    icon: (
      <>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </>
    ),
  },
  {
    label: "Orders&Account",
    href: "/account",
    match: ["/account"],
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
];

function isActiveTab(pathname, tab) {
  return tab.match.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export default function LandingTabBar() {
  const pathname = usePathname();
  const { count } = useCart();

  function handleTabClick(event, tab) {
    if (tab.href === "/#home" && pathname === "/") {
      event.preventDefault();
      document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <nav
      aria-label="Main tabs"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e6dfd2] bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-7xl justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab);

          return (
            <li key={tab.label} className="flex-1">
              <Link
                href={tab.href}
                onClick={(event) => handleTabClick(event, tab)}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] tracking-wide transition-colors ${active
                    ? "text-[#2b211b]"
                    : "text-[#8b8679] hover:text-[#2b211b]"
                  }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-[2px] w-7 -translate-x-1/2 rounded-full bg-[#2b211b]"
                  />
                ) : null}

                <span className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[22px] w-[22px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </svg>

                  {tab.label === "Cart" && count > 0 ? (
                    <span className="absolute -right-2 -top-2 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-[#b91c1c] px-1 text-[9px] font-semibold leading-none text-white">
                      {count}
                    </span>
                  ) : null}
                </span>

                <span className={active ? "font-medium" : ""}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}