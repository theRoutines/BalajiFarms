import { formatMoney } from '../../utils/formatMoney.js'

export function OrderItemsTable({
  items = [],
  subtotalPaise = 0,
  deliveryFeePaise = 0,
  totalPaise = 0,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-husk bg-white shadow-sm">
      <div className="border-b border-husk/60 bg-cream/50 px-6 py-4">
        <h4 className="font-display text-base font-bold text-espresso">
          Items Ordered
        </h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-husk/50 text-xs font-semibold uppercase tracking-wider text-espresso/60">
              <th className="px-6 py-3.5">Product</th>
              <th className="px-6 py-3.5">Variant</th>
              <th className="px-6 py-3.5 text-center">Qty</th>
              <th className="px-6 py-3.5 text-right">Unit Price</th>
              <th className="px-6 py-3.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-husk/40 text-espresso">
            {items.map((item) => (
              <tr key={item.id || item.variantId} className="hover:bg-cream/30 transition">
                <td className="px-6 py-4 font-semibold text-espresso">
                  {item.productName}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-sand-light border border-sand/40 px-2.5 py-0.5 text-xs font-medium text-espresso">
                    {item.variantLabel}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-medium">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-right text-espresso/70">
                  {formatMoney(item.unitPricePaise)}
                </td>
                <td className="px-6 py-4 text-right font-bold text-espresso">
                  {formatMoney(item.unitPricePaise * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="border-t border-husk/80 bg-cream/40 p-6">
        <div className="ml-auto max-w-xs space-y-2.5 text-sm">
          <div className="flex justify-between text-espresso/80">
            <span>Subtotal:</span>
            <span className="font-semibold text-espresso">{formatMoney(subtotalPaise)}</span>
          </div>
          <div className="flex justify-between text-espresso/80">
            <span>Delivery Fee:</span>
            <span className="font-semibold text-espresso">
              {deliveryFeePaise === 0 ? (
                <span className="text-forest font-bold">FREE</span>
              ) : (
                formatMoney(deliveryFeePaise)
              )}
            </span>
          </div>
          <div className="border-t border-husk/80 pt-2 flex justify-between items-baseline">
            <span className="font-display font-bold text-base text-espresso">
              Grand Total:
            </span>
            <span className="font-display text-2xl font-bold text-terracotta">
              {formatMoney(totalPaise)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderItemsTable

