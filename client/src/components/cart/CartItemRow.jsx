import { useCart } from '../../context/CartContext.jsx'
import { formatMoney } from '../../utils/formatMoney.js'
import ImageWithFallback from '../common/ImageWithFallback.jsx'
import QuantityStepper from '../common/QuantityStepper.jsx'

export function CartItemRow({ item }) {
  const { updateQuantity, removeItem } = useCart()

  if (!item) return null

  const lineTotalPaise = item.pricePaise * item.quantity
  const maxLimit = Math.min(10, item.maxStock ?? 10)

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-husk bg-white p-4 sm:p-5 shadow-sm transition hover:border-sand">
      {/* Product Image & Info */}
      <div className="flex items-center gap-4 flex-1">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-husk/80 bg-cream">
          <ImageWithFallback
            src={item.imageUrl}
            alt={item.productName}
            aspectRatio="aspect-square"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
            Harvest Batch
          </span>
          <h4 className="font-display text-lg font-bold text-espresso leading-snug">
            {item.productName}
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-sand-light border border-sand/50 px-2.5 py-0.5 text-xs font-semibold text-espresso">
              {item.variantLabel}
            </span>
            <span className="text-xs text-espresso/60">
              {formatMoney(item.pricePaise)} each
            </span>
          </div>
        </div>
      </div>

      {/* Stepper, Line Total, Remove */}
      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-husk/50">
        <QuantityStepper
          quantity={item.quantity}
          onChange={(newQty) => updateQuantity(item.variantId, newQty)}
          min={1}
          max={maxLimit}
        />

        <div className="text-right min-w-[80px]">
          <span className="font-display text-lg font-bold text-espresso">
            {formatMoney(lineTotalPaise)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => removeItem(item.variantId)}
          aria-label={`Remove ${item.productName} from cart`}
          className="rounded-lg p-2 text-espresso/40 hover:bg-rose-50 hover:text-rose-600 transition focus:outline-none"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.75"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default CartItemRow

