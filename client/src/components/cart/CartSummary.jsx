import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/formatMoney.js'

export function CartSummary({ subtotalPaise = 0, itemCount = 0, onCheckout }) {
  const freeDeliveryThresholdPaise = 99900
  const isFreeDeliveryEligible = subtotalPaise >= freeDeliveryThresholdPaise
  const diffToFreeDelivery = freeDeliveryThresholdPaise - subtotalPaise

  return (
    <div className="rounded-2xl border border-husk bg-white p-6 shadow-sm">
      <h3 className="font-display text-xl font-bold text-espresso border-b border-husk/60 pb-4">
        Order Summary
      </h3>

      {/* Free Delivery Bar */}
      <div className="my-4 rounded-xl bg-linen p-3.5 border border-husk/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-forest">
          <span>🚚</span>
          {isFreeDeliveryEligible ? (
            <span>You have qualified for Free Farm Delivery!</span>
          ) : (
            <span>
              Add {formatMoney(diffToFreeDelivery)} more for Free Delivery
            </span>
          )}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-husk/60">
          <div
            className="h-full bg-forest transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(100, (subtotalPaise / freeDeliveryThresholdPaise) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3 py-4 text-sm text-espresso/80">
        <div className="flex items-center justify-between">
          <span>Items Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-bold text-espresso">{formatMoney(subtotalPaise)}</span>
        </div>

        <div className="flex items-start justify-between text-xs text-espresso/60">
          <span>Delivery Fee</span>
          <span className="text-right italic">Calculated at checkout</span>
        </div>
      </div>

      <div className="border-t border-husk/60 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-base font-bold text-espresso">
            Estimated Total
          </span>
          <div className="text-right">
            <span className="font-display text-2xl font-bold text-terracotta">
              {formatMoney(subtotalPaise)}
            </span>
            <p className="text-[11px] text-espresso/50">Taxes included</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-espresso/60 bg-cream p-3 rounded-lg border border-husk/40">
        ℹ️ <strong>Note:</strong> Delivery fee is verified from your delivery pincode in the next step.
      </p>

      <div className="mt-6">
        {onCheckout ? (
          <button
            type="button"
            onClick={onCheckout}
            disabled={itemCount === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-terracotta py-3.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-dark disabled:opacity-50 transition"
          >
            <span>Proceed to Checkout</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        ) : (
          <Link
            to="/checkout"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-terracotta py-3.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-dark transition"
          >
            <span>Proceed to Checkout</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-espresso/50">
        <span>🔒 Secure Checkout</span>
        <span>•</span>
        <span>✓ Direct Farm Dispatch</span>
      </div>
    </div>
  )
}

export default CartSummary

