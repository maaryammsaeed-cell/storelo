import Image from "next/image";

// Ek product ki rating 5 sitaron me dikhata hai (gold = bhari hui, grey = khali)
function RatingStars({ rating, reviews }) {
  const roundedRating = Math.round(rating);

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Rating ${rating} out of 5, ${reviews} reviews`}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            viewBox="0 0 24 24"
            className={`h-3 w-3 ${star <= roundedRating ? "text-[#c9a24a]" : "text-[#d8d3c7]"}`}
            fill="currentColor"
          >
            <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17.3 6.7 20.1l1.1-6L3.4 9.9l6-.8L12 3.5Z" />
          </svg>
        ))}
      </div>
      <span className="text-[11px] text-[#8b8679]">({reviews})</span>
    </div>
  );
}

// Ek product ka card: image, sale badge, name, price, colors aur rating
export default function ProductCard({ product }) {
  return (
    <article className="group">
      {/* Product image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#f4f1ea]">
        {product.oldPrice ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#1f2119] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
            Sale
          </span>
        ) : null}

        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* Product details */}
      <div className="mt-4 space-y-2">
        <h3 className="text-sm text-[#1f2119]">{product.title}</h3>

        <p className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[#1f2119]">${product.price}</span>
          {product.oldPrice ? (
            <span className="text-[#9a958a] line-through">
              ${product.oldPrice}
            </span>
          ) : null}
        </p>

        <div className="flex items-center justify-between pt-1">
          {/* Available colors */}
          <div className="flex items-center gap-1.5">
            {(product.colors ?? []).map((color) => (
              <span
                key={color}
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <RatingStars rating={product.rating ?? 0} reviews={product.reviews ?? 0} />
        </div>
      </div>
    </article>
  );
}
