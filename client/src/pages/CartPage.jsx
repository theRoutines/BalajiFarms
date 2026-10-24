import { Link, useNavigate } from 'react-router-dom'
import CartItemRow from '../components/cart/CartItemRow.jsx'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useCart } from '../context/CartContext.jsx'

export function CartPage() {
  const { items, itemCount, subtotalPaise, clearCart } = useCart()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-husk pb-6 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
            Farm Direct
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso sm:text-4xl">
            Your Farm Basket
          </h1>
          <p className="mt-1 text-sm text-espresso/60">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} harvested and reserved in your session
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline self-start sm:self-auto"
          >
            Clear Entire Cart
          </button>
        )}
      </div>

      {/* Main Cart Content */}
      <div className="mt-8">
        {items.length === 0 ? (
          <div className="py-12 max-w-lg mx-auto">
            <EmptyState
              title="Your farm basket is empty"
              description="You have not added any pure A2 ghee or cold-pressed oils to your basket yet."
              actionText="Explore Farm Store"
              onAction={() => navigate('/shop')}
              icon="🌾"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Items Column */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}

              <div className="pt-4 flex items-center justify-between">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <CartSummary
                  subtotalPaise={subtotalPaise}
                  itemCount={itemCount}
                  onCheckout={() => navigate('/checkout')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage

