export default function Landingherosec() {
  return (
    <section
      id="home"
      className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-white px-5 py-16 text-[#1f2119] sm:px-8 lg:py-24"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        {/* Main heading */}
        <h1 className="font-playfair text-4xl leading-[1.15] tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Style That Speaks,{" "}
          <span className="italic text-[#b37b95]">Elegance</span> That Lasts.
        </h1>

        {/* Heading ke neechay wazahat */}
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#6b675e] text-pretty sm:text-lg">
          Discover the perfect blend of fashion and elegance with our collection
          of dresses, shoes, and bags. Find your style, express yourself, and
          make every moment fashionable.
        </p>

        {/* Button */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#products"
            className="rounded-full bg-[#b37b95] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#34372b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2119]"
          >
            Shop Now
          </a>
        </div>
      </div>
    </section>
  );
}
