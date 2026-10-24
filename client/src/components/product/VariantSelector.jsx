import { formatMoney } from '../../utils/formatMoney.js'

export function VariantSelector({ variants = [], selectedVariant, onSelect }) {
  if (!variants || variants.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-charcoal/80">
        Select Size / Quantity:
      </label>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id
          const isOutOfStock = variant.stock <= 0
          const isLowStock = variant.stock > 0 && variant.stock <= 5

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onSelect(variant)}
              className={`relative flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-forest ${
                isSelected
                  ? 'border-forest bg-forest/5 ring-1 ring-forest shadow-sm'
                  : 'border-stone-200 bg-white hover:border-forest/40'
              } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-stone-100 border-stone-200' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-charcoal">{variant.label}</span>
                <span className="text-xs font-medium text-forest">
                  {formatMoney(variant.pricePaise)}
                </span>
              </div>

              {isOutOfStock && (
                <span className="mt-1 text-[11px] font-medium text-rose-600">
                  Out of stock
                </span>
              )}

              {isLowStock && (
                <span className="mt-1 text-[11px] font-semibold text-amber-700">
                  Only {variant.stock} left
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default VariantSelector

