import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/formatMoney.js'
import StatusBadge from '../common/StatusBadge.jsx'

export function OrderCard({ order }) {
  if (!order) return null

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-husk bg-white p-6 shadow-sm transition hover:shadow-md hover:border-sand">
      {/* Left side: Order number, date, items summary */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-bold text-espresso">
            #{order.orderNumber}
          </span>
          <span className="text-xs text-espresso/40">•</span>
          <span className="text-xs text-espresso/60">{formattedDate}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Items summary */}
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-sm font-medium text-espresso/90">
            {order.items?.map((item, idx) => (
              <span key={item.id || idx}>
                {item.productName} ({item.variantLabel}) × {item.quantity}
                {idx < (order.items.length - 1) ? ', ' : ''}
              </span>
            ))}
          </p>
          <span className="text-xs text-espresso/50">
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'} total
          </span>
        </div>
      </div>

      {/* Right side: Total and Action button */}
      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-husk/50 pt-3 sm:pt-0">
        <div className="text-left sm:text-right">
          <span className="text-[11px] uppercase tracking-wider text-espresso/60 block">
            Total Paid / Due
          </span>
          <span className="font-display text-xl font-bold text-terracotta">
            {formatMoney(order.totalPaise)}
          </span>
        </div>

        <Link
          to={`/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-espresso/20 bg-cream px-4 py-2 text-xs font-semibold text-espresso hover:bg-espresso hover:text-cream transition shadow-sm"
        >
          <span>Track Order</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

export default OrderCard

