import { TIMELINE_STEPS } from '../../utils/constants.js'

export function OrderTimeline({ status, history = [], isPaidAndCancelled = false }) {
  const isCancelled = status === 'CANCELLED'
  const isExpired = status === 'EXPIRED'

  if (isCancelled || isExpired) {
    return (
      <div
        role="alert"
        className={`rounded-2xl border p-6 text-center ${
          isCancelled
            ? 'border-rose-300 bg-rose-50/80 text-rose-950'
            : 'border-stone-300 bg-stone-100/90 text-stone-900'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">{isCancelled ? '✕' : '⏱'}</span>
          <h4 className="font-display text-xl font-bold">
            {isCancelled ? 'Order Cancelled' : 'Order Expired'}
          </h4>
          <p className="mt-2 max-w-lg text-sm text-charcoal/80">
            {isCancelled
              ? isPaidAndCancelled
                ? 'This order was cancelled by the farm staff. Your captured payment has been refunded to your source account.'
                : 'This order was cancelled before payment was captured. Any reserved inventory has been restored.'
              : 'The payment reservation time limit of 15 minutes expired before payment was completed. Stock has been restored.'}
          </p>
        </div>
      </div>
    )
  }

  const stepLabels = {
    PENDING_PAYMENT: 'Pending Payment',
    PAID: 'Paid',
    PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(status)

  // Helper to extract timestamp from order history
  function getStepTimestamp(step) {
    const entry = history.find((h) => h.toStatus === step)
    if (!entry || !entry.createdAt) return null
    try {
      const d = new Date(entry.createdAt)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  }

  return (
    <div className="rounded-2xl border border-husk bg-white p-6 sm:p-8 shadow-sm">
      <h3 className="font-display text-lg font-bold text-espresso mb-8 border-b border-husk/50 pb-3">
        Order Progress
      </h3>

      <div className="relative">
        {/* Horizontal Connector Line for desktop */}
        <div className="absolute top-5 left-6 right-6 hidden h-0.5 bg-husk sm:block" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-5 sm:gap-2">
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isDoneOrActive = index <= currentStepIndex
            const timestamp = getStepTimestamp(step)

            return (
              <div
                key={step}
                className="relative flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2"
                data-testid={`timeline-step-${step}`}
              >
                {/* Step Circle */}
                <div
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isDoneOrActive
                      ? 'border-terracotta bg-terracotta text-white shadow-md'
                      : 'border-husk-dark bg-white text-espresso/40'
                  } ${isCurrent ? 'ring-4 ring-terracotta/20 font-bold' : ''}`}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step Text Info */}
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isDoneOrActive ? 'text-espresso' : 'text-espresso/50'
                    }`}
                  >
                    {stepLabels[step]}
                  </span>
                  {timestamp && (
                    <span className="text-[10px] text-espresso/50 mt-0.5">
                      {timestamp}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OrderTimeline

