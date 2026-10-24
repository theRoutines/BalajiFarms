export const BRAND_NAME = 'Balaji Farms'

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export const TIMELINE_STEPS = [
  'PENDING_PAYMENT',
  'PAID',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

export const STATUS_COLORS = {
  PENDING_PAYMENT: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  PAID: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  PACKED: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  OUT_FOR_DELIVERY: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  DELIVERED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  EXPIRED: {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    dot: 'bg-stone-500',
  },
}

