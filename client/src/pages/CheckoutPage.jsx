import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { checkPincode, createCheckout } from '../api/orderApi.js'
import Button from '../components/common/Button.jsx'
import FormField from '../components/common/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { BRAND_NAME } from '../utils/constants.js'
import { formatMoney } from '../utils/formatMoney.js'
import { loadRazorpay } from '../utils/loadRazorpay.js'

export function CheckoutPage() {
  const { user } = useAuth()
  const { items, subtotalPaise, clearCart } = useCart()
  const navigate = useNavigate()

  // 1. Redirect to /cart if empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [items, navigate])

  // 4. One idempotency key per checkout in useRef; renewed only when cart contents change
  const cartSignature = JSON.stringify(
    items.map((i) => ({ v: i.variantId, q: i.quantity })),
  )
  const idempotencyKeyRef = useRef(crypto.randomUUID())
  const prevSignatureRef = useRef(cartSignature)

  if (prevSignatureRef.current !== cartSignature) {
    idempotencyKeyRef.current = crypto.randomUUID()
    prevSignatureRef.current = cartSignature
  }

  // Address form state
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [zoneInfo, setZoneInfo] = useState(null)
  const [isCheckingPincode, setIsCheckingPincode] = useState(false)
  const [pincodeError, setPincodeError] = useState('')
  const [inlineStockError, setInlineStockError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 2. When pincode has 6 digits, call checkPincode
  useEffect(() => {
    const rawPincode = shippingAddress.pincode.trim()
    if (rawPincode.length === 6 && /^\d{6}$/.test(rawPincode)) {
      let isCurrent = true
      setIsCheckingPincode(true)
      setPincodeError('')

      checkPincode(rawPincode)
        .then((data) => {
          if (isCurrent) {
            setZoneInfo(data)
            setPincodeError('')
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setZoneInfo(null)
            setPincodeError(err.message || 'We do not deliver here yet')
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsCheckingPincode(false)
          }
        })

      return () => {
        isCurrent = false
      }
    } else {
      setZoneInfo(null)
      if (rawPincode.length > 0 && rawPincode.length !== 6) {
        setPincodeError('Pincode must be 6 digits')
      } else {
        setPincodeError('')
      }
    }
  }, [shippingAddress.pincode])

  function handleInputChange(e) {
    const { name, value } = e.target
    setShippingAddress((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (inlineStockError) {
      setInlineStockError('')
    }
  }

  function validateForm() {
    const errors = {}
    if (!shippingAddress.name.trim()) errors.name = 'Full name is required'
    if (!shippingAddress.phone.trim() || !/^\d{10}$/.test(shippingAddress.phone.trim())) {
      errors.phone = '10-digit mobile number is required'
    }
    if (!shippingAddress.line1.trim()) errors.line1 = 'Address line 1 is required'
    if (!shippingAddress.city.trim()) errors.city = 'City is required'
    if (!shippingAddress.state.trim()) errors.state = 'State is required'
    if (!shippingAddress.pincode.trim() || !/^\d{6}$/.test(shippingAddress.pincode.trim())) {
      errors.pincode = '6-digit pincode is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 3. Totals preview
  const deliveryFeePaise = zoneInfo ? zoneInfo.deliveryFeePaise : 0
  const totalPaise = subtotalPaise + deliveryFeePaise

  async function handlePay(e) {
    e.preventDefault()
    setInlineStockError('')

    if (!validateForm()) {
      toast.error('Please complete all required shipping fields')
      return
    }

    if (!zoneInfo) {
      toast.error('Please enter a serviceable 6-digit delivery pincode')
      return
    }

    // 4. Disable Pay button while request runs
    setIsSubmitting(true)

    try {
      const payload = {
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          name: shippingAddress.name.trim(),
          phone: shippingAddress.phone.trim(),
          line1: shippingAddress.line1.trim(),
          line2: shippingAddress.line2.trim() || undefined,
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          pincode: shippingAddress.pincode.trim(),
        },
      }

      // 5. Call createCheckout with Idempotency-Key
      const res = await createCheckout(payload, idempotencyKeyRef.current)
      const { order, payment } = res

      // 6. Clear cart as soon as order exists on server
      clearCart()

      // Load and open Razorpay
      const Razorpay = await loadRazorpay()
      const options = {
        key: payment.keyId,
        order_id: payment.razorpayOrderId,
        amount: payment.amountPaise,
        currency: payment.currency || 'INR',
        name: BRAND_NAME,
        description: `Order #${order.orderNumber}`,
        prefill: {
          name: shippingAddress.name,
          email: user?.email,
          phone: shippingAddress.phone,
        },
        // 7. On success go to /orders/:id?justPaid=1
        handler: function () {
          navigate(`/orders/${order.id}?justPaid=1`)
        },
        // 7. On dismiss go to /orders/:id
        modal: {
          ondismiss: function () {
            navigate(`/orders/${order.id}`)
          },
        },
      }

      const rzp = new Razorpay(options)
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || 'Payment was not completed')
        navigate(`/orders/${order.id}`)
      })
      rzp.open()
    } catch (err) {
      // 5. A 409 stock error is shown inline
      if (err.status === 409) {
        setInlineStockError(
          err.message || 'One or more items in your cart are no longer available in the requested stock.',
        )
      } else {
        toast.error(err.message || 'Checkout creation failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-husk pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
          Checkout
        </span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso sm:text-4xl">
          Delivery & Payment
        </h1>
        <p className="mt-1 text-sm text-espresso/60">
          Enter your delivery details and proceed to secure Razorpay checkout
        </p>
      </div>

      {/* 5. Inline 409 Stock Error Alert */}
      {inlineStockError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1 text-sm">
              <h4 className="font-bold">Stock Availability Notice</h4>
              <p className="mt-1 text-amber-900">{inlineStockError}</p>
              <div className="mt-3 flex items-center gap-4">
                <Link
                  to="/cart"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-800"
                >
                  Adjust Cart Quantities →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handlePay} noValidate className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Left 2 Columns: Address Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-husk bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-espresso border-b border-husk/50 pb-4">
              1. Delivery Address
            </h3>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="Full Name"
                id="name"
                name="name"
                required
                value={shippingAddress.name}
                onChange={handleInputChange}
                error={fieldErrors.name}
              />

              <FormField
                label="Phone Number (10 Digits)"
                id="phone"
                name="phone"
                type="tel"
                maxLength={10}
                required
                value={shippingAddress.phone}
                onChange={handleInputChange}
                error={fieldErrors.phone}
              />

              <div className="sm:col-span-2">
                <FormField
                  label="Street Address / Flat / House No."
                  id="line1"
                  name="line1"
                  required
                  placeholder="e.g. 104, Green Meadows, MG Road"
                  value={shippingAddress.line1}
                  onChange={handleInputChange}
                  error={fieldErrors.line1}
                />
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Apartment, Suite, Landmark (Optional)"
                  id="line2"
                  name="line2"
                  placeholder="Near City Park"
                  value={shippingAddress.line2}
                  onChange={handleInputChange}
                />
              </div>

              <FormField
                label="City"
                id="city"
                name="city"
                required
                value={shippingAddress.city}
                onChange={handleInputChange}
                error={fieldErrors.city}
              />

              <FormField
                label="State"
                id="state"
                name="state"
                required
                value={shippingAddress.state}
                onChange={handleInputChange}
                error={fieldErrors.state}
              />

              {/* 2. Pincode and Serviceability check */}
              <div className="sm:col-span-2">
                <FormField
                  label="Pincode (6 Digits)"
                  id="pincode"
                  name="pincode"
                  required
                  maxLength={6}
                  placeholder="e.g. 110001"
                  value={shippingAddress.pincode}
                  onChange={handleInputChange}
                  error={fieldErrors.pincode || pincodeError}
                />

                {isCheckingPincode && (
                  <p className="mt-2 text-xs text-espresso/60 flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
                    Checking delivery serviceability...
                  </p>
                )}

                {zoneInfo && (
                  <div className="mt-2.5 rounded-xl border border-forest/20 bg-forest-light/60 p-3 text-xs text-forest flex items-center justify-between">
                    <div>
                      <span className="font-bold">✓ Delivers to {zoneInfo.areaName}</span>
                      <p className="text-[11px] text-forest/80">Refrigerated farm dispatch available</p>
                    </div>
                    <span className="font-bold text-sm">
                      {zoneInfo.deliveryFeePaise === 0
                        ? 'FREE Delivery'
                        : formatMoney(zoneInfo.deliveryFeePaise)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: 3. Order Summary & Pay Action */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-2xl border border-husk bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-bold text-espresso border-b border-husk/50 pb-4">
              2. Order Summary
            </h3>

            {/* Items list snippet */}
            <div className="my-4 divide-y divide-husk/40 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <span className="font-semibold text-espresso">{item.productName}</span>
                    <span className="text-espresso/50 block">
                      {item.variantLabel} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-espresso">
                    {formatMoney(item.pricePaise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 border-t border-husk/60 py-4 text-sm text-espresso/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-espresso">{formatMoney(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span>
                  {zoneInfo ? (
                    zoneInfo.deliveryFeePaise === 0 ? (
                      <span className="text-forest font-bold">FREE</span>
                    ) : (
                      formatMoney(zoneInfo.deliveryFeePaise)
                    )
                  ) : (
                    <span className="text-xs text-espresso/50 italic">Enter 6-digit pincode</span>
                  )}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-husk/60 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="font-display text-base font-bold text-espresso">
                  Total Amount
                </span>
                <span className="font-display text-2xl font-bold text-terracotta">
                  {formatMoney(totalPaise)}
                </span>
              </div>
            </div>

            {/* 4. Pay Button (disabled while request runs or if no zone) */}
            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || !zoneInfo}
                className="w-full shadow-md"
              >
                {isSubmitting
                  ? 'Securing Reservation...'
                  : `Pay ${formatMoney(totalPaise)} with Razorpay`}
              </Button>
            </div>

            <div className="mt-4 text-center text-[11px] text-espresso/50 leading-relaxed">
              Stock is reserved for 15 minutes upon placing order. Payment is safely processed in test mode via Razorpay.
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CheckoutPage

