let io

export function setIo(socketServer) {
  io = socketServer
}

export function emitOrderUpdate(order) {
  if (!io || !order) return
  const update = { orderId: order.id, orderNumber: order.orderNumber, status: order.status, updatedAt: order.updatedAt }
  io.to(`user:${order.userId}`).emit('order:update', update)
  io.to('staff:admin').emit('order:update', update)
  if (['PAID', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
    io.to('staff:delivery').emit('order:update', update)
  }
}
