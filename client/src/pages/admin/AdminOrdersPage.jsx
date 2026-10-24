import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  cancelAdminOrder,
  getAdminOrders,
  packAdminOrder,
} from '../../api/adminApi.js'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import OrderItemsTable from '../../components/orders/OrderItemsTable.jsx'
import { formatMoney } from '../../utils/formatMoney.js'

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [viewModalOrder, setViewModalOrder] = useState(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const statusTabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'PAID', label: 'Paid (Ready to Pack)' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'PENDING_PAYMENT', label: 'Pending Payment' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ]

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = { page, pageSize }
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus
      }

      const res = await getAdminOrders(params)
      setOrders(res.orders || [])
      setTotal(res.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load admin orders')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, selectedStatus])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function handlePack(orderId) {
    try {
      setIsProcessingAction(true)
      await packAdminOrder(orderId)
      toast.success('Order marked as PACKED!')
      fetchOrders()
    } catch (err) {
      toast.error(err.message || 'Could not pack order')
    } finally {
      setIsProcessingAction(false)
    }
  }

  async function handleConfirmCancel() {
    if (!cancelModalOrder) return
    try {
      setIsProcessingAction(true)
      await cancelAdminOrder(cancelModalOrder.id)
      toast.success('Order cancelled (and refunded if paid)')
      setCancelModalOrder(null)
      fetchOrders()
    } catch (err) {
      toast.error(err.message || 'Could not cancel order')
    } finally {
      setIsProcessingAction(false)
    }
  }

  const columns = [
    {
      header: 'Order / Customer',
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-espresso">#{order.orderNumber}</span>
          <span className="text-xs font-semibold text-espresso/90">{order.user?.name}</span>
          <span className="text-[11px] text-espresso/50">📞 {order.user?.phone}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      render: (order) => (
        <span className="text-xs text-espresso/70">
          {new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Items',
      render: (order) => (
        <div className="text-xs max-w-xs text-espresso/80 truncate">
          {order.items?.map((i) => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(', ')}
        </div>
      ),
    },
    {
      header: 'Total',
      render: (order) => (
        <span className="font-display font-bold text-terracotta">
          {formatMoney(order.totalPaise)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (order) => {
        const canPack = order.status === 'PAID'
        const canCancel =
          order.status === 'PAID' ||
          order.status === 'PACKED' ||
          order.status === 'PENDING_PAYMENT'

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setViewModalOrder(order)}
              className="rounded-lg border border-husk px-2.5 py-1 text-xs font-semibold text-espresso hover:bg-cream"
            >
              View
            </button>

            {canPack && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePack(order.id)}
                disabled={isProcessingAction}
              >
                Pack Order
              </Button>
            )}

            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelModalOrder(order)}
                disabled={isProcessingAction}
              >
                Cancel
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
            Order Fulfillment
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso">
            Orders Management
          </h1>
          <p className="mt-1 text-xs text-espresso/60">
            Pack paid batches, monitor customer delivery states, and manage cancellations
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

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-husk">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.key)
                setPage(1)
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-terracotta text-white shadow-sm'
                  : 'bg-white border border-husk text-espresso/70 hover:bg-cream'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="No orders found matching the selected filter."
      />

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border-t border-husk pt-4 text-xs text-espresso/70">
        <span>
          Showing {orders.length} of {total} orders
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="font-semibold text-espresso">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        title={`Cancel Order #${cancelModalOrder?.orderNumber}?`}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCancelModalOrder(null)}
            >
              No, Keep Order
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isProcessingAction}
              onClick={handleConfirmCancel}
            >
              Yes, Cancel & Refund
            </Button>
          </div>
        }
      >
        <p className="text-sm text-espresso/80">
          Cancelling this order will mark it as CANCELLED. If the customer has already paid via Razorpay, a full refund will be triggered immediately to their source account.
        </p>
      </Modal>

      {/* Order Details View Modal */}
      <Modal
        isOpen={!!viewModalOrder}
        onClose={() => setViewModalOrder(null)}
        title={`Order #${viewModalOrder?.orderNumber}`}
      >
        {viewModalOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={viewModalOrder.status} />
              <span className="font-display font-bold text-lg text-terracotta">
                {formatMoney(viewModalOrder.totalPaise)}
              </span>
            </div>

            <OrderItemsTable
              items={viewModalOrder.items}
              subtotalPaise={viewModalOrder.subtotalPaise}
              deliveryFeePaise={viewModalOrder.deliveryFeePaise}
              totalPaise={viewModalOrder.totalPaise}
            />

            <div className="rounded-xl border border-husk bg-cream/40 p-4 text-xs space-y-1">
              <p className="font-bold text-espresso">Customer & Delivery Address:</p>
              <p>{viewModalOrder.user?.name} ({viewModalOrder.user?.email})</p>
              <p>{viewModalOrder.shippingAddress?.line1}, {viewModalOrder.shippingAddress?.city}, {viewModalOrder.shippingAddress?.state} - {viewModalOrder.shippingAddress?.pincode}</p>
              <p className="text-espresso/60">Phone: {viewModalOrder.shippingAddress?.phone}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminOrdersPage

