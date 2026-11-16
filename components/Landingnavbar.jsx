import Image from "next/image";
import Link from "next/link";
import CartLink from "./CartLink";

// Navbar ke links. Naya link chahiye to yahan add karo —
// href abhi placeholder hai, jab pages banao to asli route laga dena.
const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "#products" },
  { label: "Services", href: "#services" },
  { label: "Access", href: "/login" },
];

export default function Landingnavbar({ storeName = "Storelo", logo = "" }) {
  return (
    <header className=" top-0 z-20 bg-[#ffffff] shadow-sm backdrop-blur ">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-3.5 sm:px-8">
        {/* Logo — left side */}

        <Link href="/" aria-label={storeName} className="flex items-baseline">
          <span className="font-playfair text-3xl uppercase tracking-[0.3em] text-[#3c3e2d] sm:text-4xl">
            {storeName.slice(0, -1)}
            <span className="text-[#b91c1c]">{storeName.slice(-1)}</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav>
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-[#f4f1e7]/80">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="transition hover:text-[#e6d3a3]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <CartLink />
      </div>
    </header>
  );
}                                                                               