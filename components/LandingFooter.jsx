// Page ke aakhir me closing CTA — "Shop with Confidence"
// Text ya button badalna ho to isi file me karein.
export default function LandingFooter() {
  return (
    <section className="bg-[#f7f4ee] px-5 py-20 text-center sm:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-playfair text-4xl leading-tight tracking-tight text-[#1f2119] sm:text-5xl">
          Shop with Confidence
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6b675e] sm:text-base">
          Quality products, trusted service, and a better shopping experience —
          every time you shop with us.
        </p>

        <a
          href="#products"
          className="mt-9 inline-flex items-center gap-3 rounded-md bg-[#b37b95] px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#34372b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2119]"
        >
          Start Shopping
          {/* Arrow icon */}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
