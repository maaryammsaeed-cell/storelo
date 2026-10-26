import Link from "next/link";

// Navbar ke links. Naya link chahiye to yahan add karo —
// href abhi placeholder hai, jab pages banao to asli route laga dena.
const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "#products" },
  { label: "Services", href: "#services" },
  { label: "Access", href: "/login" },
];

export default function Landingnavbar() {
  return (
    <header className="sticky top-0 z-20 bg-[#b37b95] shadow-sm backdrop-blur ">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-3.5 sm:px-8">
        {/* Logo — left side */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6d3a3] text-[#3c3e2d]">
            {/* shopping bag icon */}
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 8h12l-1 11H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </span>
          <span className="text-xl font-semibold tracking-wide text-[#f4f1e7]">
            Storelo
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
      </div>
    </header>
  );
}
