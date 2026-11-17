import Link from "next/link";


// Navbar ke links. Naya link chahiye to yahan add karo —
// href abhi placeholder hai, jab pages banao to asli route laga dena.

export default function Landingnavbar({ storeName = "Storelo" }) {
  return (
    <header className=" top-0 z-20 bg-[#f7f1ec] shadow-sm backdrop-blur ">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-2 sm:px-8">
        {/* Logo — left side */}

        <Link href="/" aria-label={storeName} className="flex items-baseline">
          <span className="font-playfair text-3xl uppercase tracking-[0.3em] text-[#0f0f0f] sm:text-4xl">
            {storeName.slice(0, -1)}
            <span className="text-[#7c6759]">{storeName.slice(-1)}</span>
          </span>
        </Link>

     
        
      </div>
    </header>
  );
}