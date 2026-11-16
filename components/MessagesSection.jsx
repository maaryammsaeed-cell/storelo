"use client";

import { useState } from "react";
import Link from "next/link";

const categories = [
  {
    label: "Chats",
    color: "bg-[#0e9f6e]",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </>
    ),
  },
  {
    label: "Orders",
    color: "bg-[#2563eb]",
    icon: (
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    label: "Alerts",
    color: "bg-[#e8a021]",
    icon: <path d="M13 2 4.5 13H11l-1 9 8.5-11H12z" />,
  },
  {
    label: "Promos",
    color: "bg-[#e11d63]",
    icon: (
      <>
        <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
        <path d="M16 8a5 5 0 0 1 0 8" />
        <path d="M19 5a9 9 0 0 1 0 14" />
      </>
    ),
  },
];

export default function MessagesSection() {
  const [active, setActive] = useState("Chats");

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8">
      {/* Header: title + mark all as read */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-playfair text-3xl tracking-tight text-[#1f2119]">
          Messages
        </h1>

        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-[#6b675e] transition hover:text-[#b37b95]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m2 12 5 5L17 7" />
            <path d="m12 17 1 1L22 7" />
          </svg>
          Mark all as read
        </button>
      </div>

      {/* Category circles */}
      <div className="mt-7 grid grid-cols-4 gap-2 border-b border-[#e7e3da] pb-6">
        {categories.map((category) => {
          const isActive = category.label === active;

          return (
            <button
              key={category.label}
              type="button"
              onClick={() => setActive(category.label)}
              aria-pressed={isActive}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-full text-white transition sm:h-12 sm:w-12 ${category.color} ${
                  isActive
                    ? "ring-2 ring-[#3c3e2d] ring-offset-2"
                    : "opacity-90"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {category.icon}
                </svg>
              </span>

              <span
                className={`text-[11px] sm:text-xs ${
                  isActive
                    ? "font-medium text-[#1f2119]"
                    : "text-[#6b675e]"
                }`}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center px-4 py-14 text-center sm:py-20">
        <svg
          viewBox="0 0 160 120"
          className="h-28 w-36"
          fill="none"
          aria-hidden="true"
        >
          <rect x="42" y="14" width="62" height="14" rx="7" fill="#f0d9ca" />
          <rect x="32" y="36" width="82" height="14" rx="7" fill="#f0d9ca" />
          <rect x="48" y="58" width="60" height="14" rx="7" fill="#f0d9ca" />
          <circle
            cx="98"
            cy="82"
            r="17"
            fill="#fdfaf6"
            stroke="#d98a63"
            strokeWidth="4"
          />
          <circle cx="98" cy="82" r="6" stroke="#d98a63" strokeWidth="4" />
          <path
            d="m86 94-8 8"
            stroke="#d98a63"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        <p className="mt-8 max-w-xs text-sm leading-6 text-[#55544a]">
          Once you receive any personalized messages, you&apos;ll see them
          listed here.
        </p>

        <Link
          href="/#products"
          className="mt-8 rounded-full bg-gradient-to-r from-[#e07a5f] to-[#b37b95] px-10 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2119]"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}