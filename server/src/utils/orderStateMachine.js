const allowedTransitions = Object.freeze({
  PENDING_PAYMENT: ['PAID', 'CANCELLED', 'EXPIRED'],
  PAID: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
})

export function canTransition(fromStatus, toStatus) {
  const nextStatuses = allowedTransitions[fromStatus] || []
  return nextStatuses.includes(toStatus)
}

export function getAllowedNextStatuses(status) {
  return [...(allowedTransitions[status] || [])]
}
