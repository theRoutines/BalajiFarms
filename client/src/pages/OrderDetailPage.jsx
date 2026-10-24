import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cancelOrder, getMyOrder, getPaymentSession } from '../api/orderApi.js'
import Button from '../components/common/Button.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loader from '../components/common/Loader.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import OrderItemsTable from '../components/orders/OrderItemsTable.jsx'
import OrderTimeline from '../components/orders/OrderTimeline.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useOrderSocket } from '../hooks/useOrderSocket.js'
import { BRAND_NAME } from '../utils/constants.js'
import { formatMoney } from '../utils/formatMoney.js'
import { loadRazorpay } from '../utils/loadRazorpay.js'

export function OrderDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isJustPaid = searchParams.get('justPaid') === '1'
  const { user } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')

  // 1. Fetch Order data
  const fetchOrder = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true)
        const data = await getMyOrder(id)
        setOrder(data.order)
        setError(null)
      } catch (err) {
        setError(err.message || 'Could not load order details')
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    fetchOrder(true)
  }, [fetchOrder])

  // 2. useOrderSocket: when an update arrives for this order id, refetch the order
  const handleSocketUpdate = useCallback(
    (payload) => {
      if (payload && Number(payload.orderId) === Number(id)) {
        fetchOrder(false)
      }
    },
    [id, fetchOrder],
  )

  useOrderSocket(handleSocketUpdate)

  // 3. Fallback polling for up to 60s when ?justPaid=1 and status is PENDING_PAYMENT
  useEffect(() => {
    if (!isJustPaid || !order || order.status !== 'PENDING_PAYMENT') return

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += 3
      fetchOrder(false)
      if (elapsed >= 60) {
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isJustPaid, order?.status, fetchOrder])

  // 4. Countdown to reservationExpiresAt for PENDING_PAYMENT orders
  useEffect(() => {
    if (!order || order.status !== 'PENDING_PAYMENT' || !order.reservationExpiresAt) {
      setTimeRemaining('')
      return
    }

    function updateCountdown() {
      const targetTime = new Date(order.reservationExpiresAt).getTime()
      const now = Date.now()
      const diff = targetTime - now

      if (diff <= 0) {
        setTimeRemaining('Expired')
        fetchOrder(false)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [order, fetchOrder])

  // 5. Pay now button for PENDING_PAYMENT orders
  async function handlePayNow() {
    if (!order) return
    setIsProcessingAction(true)

    try {
      const data = await getPaymentSession(order.id)
      const payment = data.payment

      const Razorpay = await loadRazorpay()
      const options = {
        key: payment.keyId,
        order_id: payment.razorpayOrderId,
        amount: payment.amountPaise,
        currency: payment.currency || 'INR',
        name: BRAND_NAME,
        description: `Order #${order.orderNumber}`,
        prefill: {
          name: order.shippingAddress?.name || user?.name,
          email: user?.email,
          phone: order.shippingAddress?.phone || user?.phone,
        },
        handler: function () {
          navigate(`/orders/${order.id}?justPaid=1`)
          fetchOrder(false)
        },
        modal: {
          ondismiss: function () {
            fetchOrder(false)
          },
        },
      }

      const rzp = new Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        toast.error(resp.error?.description || 'Payment retry failed')
        fetchOrder(false)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Failed to initiate payment retry')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // 6. Cancel order button for PENDING_PAYMENT orders
  async function handleCancelOrder() {
    if (!window.confirm('Are you sure you want to cancel this pending order?')) return

    setIsProcessingAction(true)
    try {
      await cancelOrder(order.id)
      toast.success('Order cancelled successfully')
      fetchOrder(false)
    } catch (err) {
      toast.error(err.message || 'Could not cancel order')
    } finally {
      setIsProcessingAction(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" text="Retrieving order live tracker..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <ErrorMessage
          title="Order Not Found"
          message={error || 'We could not find the specified order.'}
          onRetry={() => fetchOrder(true)}
        />
        <Link
          to="/orders"
          className="mt-6 inline-block rounded-lg bg-terracotta px-6 py-2.5 text-sm font-semibold text-white"
        >
          View All Orders
        </Link>
      </div>
    )
  }

  const isPaidAndCancelled =
    order.status === 'CANCELLED' &&
    order.history?.some((h) => h.toStatus === 'PAID')

  const formattedCreatedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs text-espresso/60">
          <Link to="/orders" className="hover:text-terracotta">
            ← Back to Orders
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-espresso">#{order.orderNumber}</span>
        </nav>

        <button
          type="button"
          onClick={() => fetchOrder(false)}
          className="text-xs font-semibold text-terracotta hover:underline self-start sm:self-auto"
        >
          ↻ Refresh Status
        </button>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl border border-husk bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-espresso">
                Order #{order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-xs text-espresso/60">
              Placed on {formattedCreatedDate}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-espresso/60 block">Total</span>
            <span className="font-display text-2xl font-bold text-terracotta">
              {formatMoney(order.totalPaise)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. With ?justPaid=1, show 'Confirming your payment...' */}
      {isJustPaid && order.status === 'PENDING_PAYMENT' && (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-sand bg-sand-light p-5 text-espresso shadow-sm"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
          <div className="text-sm">
            <span className="font-bold">Confirming your payment with Razorpay...</span>
            <p className="text-xs text-espresso/70 mt-0.5">
              Please wait while our verification worker registers your captured payment. This page updates automatically.
            </p>
          </div>
        </div>
      )}

      {/* 7. If OUT_FOR_DELIVERY: OTP Notice */}
      {order.status === 'OUT_FOR_DELIVERY' && (
        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-950 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📦</span>
            <div className="text-sm">
              <h4 className="font-bold">Out for Delivery Today!</h4>
              <p className="mt-1 text-purple-900">
                Share the <strong>OTP</strong> we emailed you with our delivery partner when your order arrives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. PENDING_PAYMENT: Countdown, Pay now, and Cancel Order */}
      {order.status === 'PENDING_PAYMENT' && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Action Required
              </span>
              <h3 className="font-display text-lg font-bold text-amber-950">
                Payment Pending
              </h3>
              <p className="mt-1 text-xs text-amber-900">
                Stock is reserved for you. Please complete payment before the countdown expires.
              </p>
              {timeRemaining && (
                <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-mono font-bold text-amber-900">
                  <span>⏱ Reservation Expires in:</span>
                  <span className="text-sm font-bold text-amber-950">{timeRemaining}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handlePayNow}
                isLoading={isProcessingAction}
              >
                Pay Now with Razorpay
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleCancelOrder}
                disabled={isProcessingAction}
              >
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Timeline */}
      <div className="mt-8">
        <OrderTimeline
          status={order.status}
          history={order.history}
          isPaidAndCancelled={isPaidAndCancelled}
        />
      </div>

      {/* Items Table & Shipping Address Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items Table */}
        <div className="lg:col-span-2">
          <OrderItemsTable
            items={order.items}
            subtotalPaise={order.subtotalPaise}
            deliveryFeePaise={order.deliveryFeePaise}
            totalPaise={order.totalPaise}
          />
        </div>

        {/* Shipping Address & Status History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipping Address */}
          <div className="rounded-2xl border border-husk bg-white p-6 shadow-sm">
            <h4 className="font-display text-base font-bold text-espresso border-b border-husk/50 pb-3">
              Shipping Address
            </h4>
            <div className="mt-4 text-xs leading-relaxed text-espresso/80 space-y-1">
              <p className="font-bold text-sm text-espresso">
                {order.shippingAddress?.name}
              </p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress?.line2}</p>}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                <span className="font-mono font-bold">{order.shippingAddress?.pincode}</span>
              </p>
              <p className="mt-2 pt-2 border-t border-husk/40 text-espresso/60">
                📞 {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Status History Trail */}
          <div className="rounded-2xl border border-husk bg-white p-6 shadow-sm">
            <h4 className="font-display text-base font-bold text-espresso border-b border-husk/50 pb-3">
              Audit History
            </h4>
            <div className="mt-4 space-y-3">
              {order.history?.map((h, idx) => (
                <div key={idx} className="text-xs text-espresso/70 border-l-2 border-sand pl-3 py-1">
                  <div className="flex items-center justify-between font-semibold text-espresso">
                    <span>{h.toStatus}</span>
                    <span className="text-[10px] text-espresso/40">
                      {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {h.note && <p className="text-[11px] text-espresso/60 mt-0.5">{h.note}</p>}
                  <p className="text-[10px] text-espresso/40 mt-0.5">By {h.changedBy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage

