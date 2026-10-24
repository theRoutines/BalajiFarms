import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import {
  completeDelivery,
  getDeliveryOrders,
  startDelivery,
} from '../../api/deliveryApi.js'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Loader from '../../components/common/Loader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useOrderSocket } from '../../hooks/useOrderSocket.js'
import { BRAND_NAME } from '../../utils/constants.js'
import { formatMoney } from '../../utils/formatMoney.js'

export function DeliveryOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Track OTP inputs per order { [orderId]: otpString }
  const [otpInputs, setOtpInputs] = useState({})
  const [isProcessingId, setIsProcessingId] = useState(null)

  const fetchOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      setError(null)
      const data = await getDeliveryOrders()
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message || 'Failed to load delivery orders')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(true)
  }, [fetchOrders])

  // Refreshes on socket events
  const handleSocketUpdate = useCallback(() => {
    fetchOrders(false)
  }, [fetchOrders])

  useOrderSocket(handleSocketUpdate)

  function handleOtpChange(orderId, value) {
    const numeric = value.replace(/\D/g, '').slice(0, 6)
    setOtpInputs((prev) => ({ ...prev, [orderId]: numeric }))
  }

  async function handleStartDelivery(orderId) {
    setIsProcessingId(orderId)
    try {
      await startDelivery(orderId)
      toast.success('Delivery started! Customer has been emailed an OTP.')
      fetchOrders(false)
    } catch (err) {
      toast.error(err.message || 'Could not start delivery')
    } finally {
      setIsProcessingId(null)
    }
  }

  async function handleCompleteDelivery(orderId) {
    const otp = otpInputs[orderId] || ''
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP provided by customer')
      return
    }

    setIsProcessingId(orderId)
    try {
      await completeDelivery(orderId, otp)
      toast.success('Order marked as DELIVERED successfully!')
      setOtpInputs((prev) => ({ ...prev, [orderId]: '' }))
      fetchOrders(false)
    } catch (err) {
      toast.error(err.message || 'Invalid delivery OTP')
    } finally {
      setIsProcessingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-husk pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
            Farm Dispatch Partner
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso sm:text-4xl">
            Active Deliveries
          </h1>
          <p className="mt-1 text-xs text-espresso/60">
            Fulfill packed farm produce and verify delivery handover with customer OTP
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchOrders(false)}
            className="text-xs font-semibold text-terracotta hover:underline"
          >
            ↻ Refresh Deliveries
          </button>
        </div>
      </div>

      {error && <div className="mt-6"><ErrorMessage message={error} onRetry={() => fetchOrders(true)} /></div>}

      <div className="mt-8">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader size="lg" text="Loading active dispatch manifest..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 max-w-lg mx-auto">
            <EmptyState
              title="No active deliveries"
              description="All packed orders have been delivered! Fresh batches will appear here as soon as orders are packed."
              icon="🚚"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {orders.map((order) => {
              const isPacked = order.status === 'PACKED'
              const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY'
              const otp = otpInputs[order.id] || ''
              const isBusy = isProcessingId === order.id

              return (
                <div
                  key={order.id}
                  className="flex flex-col justify-between rounded-2xl border border-husk bg-white p-6 shadow-sm transition hover:border-sand"
                >
                  <div>
                    {/* Top Order Number & Status */}
                    <div className="flex items-center justify-between border-b border-husk/50 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-espresso">
                          #{order.orderNumber}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <span className="font-display font-bold text-terracotta">
                        {formatMoney(order.totalPaise)}
                      </span>
                    </div>

                    {/* Customer Info & Address */}
                    <div className="mt-4 rounded-xl border border-husk/60 bg-cream/50 p-4 text-xs leading-relaxed">
                      <div className="flex items-center justify-between font-bold text-espresso text-sm mb-1">
                        <span>{order.shippingAddress?.name || order.user?.name}</span>
                        {/* Tap to call phone link */}
                        <a
                          href={`tel:${order.shippingAddress?.phone || order.user?.phone}`}
                          className="inline-flex items-center gap-1 rounded-md bg-forest/10 px-2 py-1 text-xs font-bold text-forest hover:bg-forest/20 transition"
                        >
                          📞 Tap to Call
                        </a>
                      </div>

                      <p className="text-espresso/90 font-medium">
                        {order.shippingAddress?.line1}
                        {order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`}
                      </p>
                      <p className="text-espresso/80">
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                        <strong className="font-mono text-espresso">{order.shippingAddress?.pincode}</strong>
                      </p>
                    </div>

                    {/* Order Items */}
                    <div className="mt-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-espresso/60 block mb-1">
                        Items in Parcel:
                      </span>
                      <ul className="divide-y divide-husk/40 text-xs text-espresso">
                        {order.items?.map((item) => (
                          <li key={item.id} className="py-1.5 flex justify-between">
                            <span className="font-medium">
                              {item.productName} ({item.variantLabel})
                            </span>
                            <span className="font-bold">× {item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-6 pt-4 border-t border-husk">
                    {isPacked && (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full shadow-md"
                        isLoading={isBusy}
                        onClick={() => handleStartDelivery(order.id)}
                      >
                        🚚 Start Delivery (Send Customer OTP)
                      </Button>
                    )}

                    {isOutForDelivery && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => handleOtpChange(order.id, e.target.value)}
                            className="w-full text-center font-mono text-base tracking-widest font-bold rounded-xl border border-husk bg-cream px-3 py-2 text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                          />
                          <Button
                            variant="botanical"
                            size="md"
                            isLoading={isBusy}
                            disabled={isBusy || otp.length !== 6}
                            onClick={() => handleCompleteDelivery(order.id)}
                            className="whitespace-nowrap"
                          >
                            ✓ Complete
                          </Button>
                        </div>
                        <p className="text-[11px] text-espresso/60 text-center">
                          Ask customer for the 6-digit OTP sent to their email
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryOrdersPage

