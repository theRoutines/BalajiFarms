import axiosClient from './axiosClient.js'

export async function checkPincode(pincode) {
  return axiosClient.get('/delivery/check', {
    params: { pincode },
  })
}

export async function createCheckout(payload, idempotencyKey) {
  return axiosClient.post('/orders/checkout', payload, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  })
}

export async function getMyOrders() {
  return axiosClient.get('/orders')
}

export async function getMyOrder(orderId) {
  return axiosClient.get(`/orders/${orderId}`)
}

export async function getPaymentSession(orderId) {
  return axiosClient.get(`/orders/${orderId}/payment-session`)
}

export async function cancelOrder(orderId) {
  return axiosClient.post(`/orders/${orderId}/cancel`)
}

