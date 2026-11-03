// Page ke aakhir me closing CTA — "Shop with Confidence"
// Text ab admin panel se aata hai (Settings → Footer).
export default function LandingFooter({ footer = {} }) {
  const {
    heading = "Shop with Confidence",
    text = "Quality products, trusted service, and a better shopping experience — every time you shop with us.",
    buttonLabel = "Start Shopping",
    buttonHref = "#products",
  } = footer;

  return (
    <section className="bg-[#f7f4ee] px-5 py-20 text-center sm:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-playfair text-4xl leading-tight tracking-tight text-[#1f2119] sm:text-5xl">
          {heading}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6b675e] sm:text-base">
          {text}
        </p>

        <a
          href={buttonHref}
          className="mt-9 inline-flex items-center gap-3 rounded-md bg-[#b37b95] px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#34372b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2119]"
        >
          {buttonLabel}
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
