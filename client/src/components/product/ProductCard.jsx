import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/formatMoney.js'
import ImageWithFallback from '../common/ImageWithFallback.jsx'

export function ProductCard({ product }) {
  if (!product) return null

  const activeVariants = product.variants?.filter((v) => v.isActive !== false) || []
  const minPricePaise =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((v) => v.pricePaise))
      : 0

  return (
    <Link
      to={`/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-forest/15 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-forest/30"
    >
      <div className="relative overflow-hidden bg-cream/50">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          aspectRatio="aspect-square"
          className="w-full transform transition duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 rounded-full bg-cream/90 px-3 py-1 text-xs font-semibold text-forest backdrop-blur-sm shadow-sm">
          From {formatMoney(minPricePaise)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold text-forest transition group-hover:text-forest/80">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
          {product.description}
        </p>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-forest/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">
            {activeVariants.length} {activeVariants.length === 1 ? 'Option' : 'Options'}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest group-hover:underline">
            View details
            <svg
              className="h-4 w-4 transition transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard

