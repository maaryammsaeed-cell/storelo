// Services section — products ke neechay 4 + 4 services dikhata hai.
// Naya service add karna ho to neeche wali list me add kar dein.
const topServices = [
  {
    title: "Free Fast Delivery",
    description: "Get free shipping on all orders above $99.",
  },
  {
    title: "Easy Returns",
    description: "Not happy with your order? Return it within 14 days.",
  },
  {
    title: "Secure Payments",
    description: "Your payment information is 100% secure with us.",
  },
  {
    title: "24/7 Customer Support",
    description: "We're here to help you anytime, every time.",
  },
];

const bottomServices = [
  {
    title: "Premium Quality",
    description: "Carefully selected products you can trust.",
  },
  {
    title: "Multiple Payment Options",
    description: "Pay the way you like with multiple secure options.",
  },
  {
    title: "Best Prices",
    description: "Find the best deals on top brands.",
  },
  {
    title: "Loyalty Rewards",
    description: "Earn points with every order and get exciting rewards.",
  },
];

// Uper wali line ka card
function ServiceCard({ title, description }) {
  return (
    <article className="rounded-md border border-[#e7e3da] bg-white px-6 py-7 text-center">
      <h3 className="text-sm font-medium text-[#1f2119]">{title}</h3>
      <span className="mx-auto mt-3 block h-px w-8 bg-[#c9a24a]" />
      <p className="mt-3 text-xs leading-6 text-[#6b675e]">{description}</p>
    </article>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="bg-white px-5 pb-24 pt-4 sm:px-8 lg:pt-6">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.35em] text-[#8f8a7d]">
            <span className="h-px w-10 bg-[#c9a24a]" />
            Our Services
            <span className="h-px w-10 bg-[#c9a24a]" />
          </p>

          <h2 className="mx-auto mt-5 max-w-2xl font-playfair text-4xl leading-tight tracking-tight text-[#1f2119] sm:text-5xl">
            We&apos;re Here to Make Your Shopping Better
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#6b675e] sm:text-base">
            From fast delivery to easy returns, we provide everything you need
            for a smooth and satisfying shopping experience.
          </p>
        </div>

        {/* Uper wali line — 4 services */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topServices.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>

        {/* Neechy wali line — 4 services, ek hi light box me */}
        <div className="mt-4 grid overflow-hidden rounded-md bg-[#f7f4ee] sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#e7e3da]">
          {bottomServices.map((service) => (
            <article
              key={service.title}
              className="px-6 py-6 text-center"
            >
              <h3 className="text-sm font-medium text-[#1f2119]">
                {service.title}
              </h3>
              <span className="mx-auto mt-3 block h-px w-8 bg-[#c9a24a]" />
              <p className="mt-3 text-xs leading-6 text-[#6b675e]">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
