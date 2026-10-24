import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyOrders } from '../api/orderApi.js'
import EmptyState from '../components/common/EmptyState.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loader from '../components/common/Loader.jsx'
import OrderCard from '../components/orders/OrderCard.jsx'

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function fetchOrders() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getMyOrders()
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message || 'Failed to load your orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-husk pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
            Order History
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso sm:text-4xl">
            My Farm Orders
          </h1>
          <p className="mt-1 text-sm text-espresso/60">
            Track live dispatch, delivery status, and view past harvest deliveries
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="text-xs font-semibold text-terracotta hover:underline self-start sm:self-auto"
        >
          ↻ Refresh Orders
        </button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader size="lg" text="Retrieving your orders..." />
          </div>
        ) : error ? (
          <div className="py-8 max-w-xl mx-auto">
            <ErrorMessage
              title="Could not load orders"
              message={error}
              onRetry={fetchOrders}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 max-w-lg mx-auto">
            <EmptyState
              title="No orders found"
              description="You have not placed any orders yet. Discover our fresh Vedic bilona ghee and cold-pressed oils."
              actionText="Start Shopping"
              onAction={() => navigate('/shop')}
              icon="📦"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage

