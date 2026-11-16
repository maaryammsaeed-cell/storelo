import Image from "next/image";

export default function Landingherosec({ hero = {} }) {
  const {
    image = "/images/hero/hero-main.jpg",
    before = "Style That Speaks,",
    accent = "Elegance",
    after = "That Lasts.",
    text = "",
    buttonLabel = "Shop Now",
    buttonHref = "#products",
  } = hero;

  return (
    <section
      id="home"
      className="relative isolate flex flex-1 flex-col justify-center overflow-hidden bg-[#f7f2ea] sm:min-h-[560px] lg:min-h-[660px]"
    >
      {/* Mobile: image upar ki taraf, text uske neechay */}
      {image ? (
        <Image
          src={image}
          alt="Storelo signature collection — bags, heels aur accessories"
          width={1440}
          height={720}
          priority
          sizes="100vw"
          className="h-52 w-full object-cover object-[70%_center] sm:hidden"
        />
      ) : null}

      {/* Desktop: image poore section ke peeche */}
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-[62%_bottom] sm:block"
        />
      ) : null}

      {/* Desktop overlay — left side cream, taake text saaf parhe */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-gradient-to-r from-[#f7f2ea]/90 via-[#f7f2ea]/55 to-transparent sm:block"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-16 lg:py-24">
        <div className="flex flex-col items-center text-center sm:max-w-xl sm:items-start sm:text-left lg:max-w-2xl">
          {/* Main heading */}
          <h1 className="font-playfair text-4xl leading-[1.15] tracking-tight text-balance text-[#2a2b22] sm:text-5xl lg:text-6xl">
            {before}{" "}
            <span className="italic text-[#b37b95]">{accent}</span> {after}
          </h1>

          {/* Heading ke neechay wazahat */}
          <p className="mt-5 max-w-xl text-base leading-7 text-[#55544a] text-pretty sm:mt-6 sm:text-lg">
            {text}
          </p>

          {/* Button */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 sm:mt-10 sm:justify-start">
            <a
              href={buttonHref}
              className="rounded-full bg-[#3c3e2d] px-8 py-3 text-sm font-medium text-[#f4f1e7] transition hover:bg-[#b37b95] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2119]"
            >
              {buttonLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
