import axiosClient from './axiosClient.js'

export async function getDeliveryOrders() {
  return axiosClient.get('/delivery/orders')
}

export async function startDelivery(orderId) {
  return axiosClient.post(`/delivery/orders/${orderId}/start`)
}

export async function completeDelivery(orderId, otp) {
  return axiosClient.post(`/delivery/orders/${orderId}/complete`, { otp })
}

