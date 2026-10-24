import axiosClient from './axiosClient.js'

// Orders
export async function getAdminOrders(params) {
  return axiosClient.get('/admin/orders', { params })
}

export async function getAdminOrder(orderId) {
  return axiosClient.get(`/admin/orders/${orderId}`)
}

export async function packAdminOrder(orderId) {
  return axiosClient.post(`/admin/orders/${orderId}/pack`)
}

export async function cancelAdminOrder(orderId) {
  return axiosClient.post(`/admin/orders/${orderId}/cancel`)
}

// Products
export async function getAdminProducts() {
  return axiosClient.get('/admin/products')
}

export async function createAdminProduct(productData) {
  return axiosClient.post('/admin/products', productData)
}

export async function updateAdminProduct(productId, productData) {
  return axiosClient.patch(`/admin/products/${productId}`, productData)
}

export async function deleteAdminProduct(productId) {
  return axiosClient.delete(`/admin/products/${productId}`)
}

export async function uploadAdminImage(imageData) {
  return axiosClient.post('/admin/upload', { image: imageData })
}

export async function createAdminVariant(productId, variantData) {
  return axiosClient.post(`/admin/products/${productId}/variants`, variantData)
}

export async function updateAdminVariant(variantId, variantData) {
  return axiosClient.patch(`/admin/variants/${variantId}`, variantData)
}

// Zones
export async function getAdminZones() {
  return axiosClient.get('/admin/zones')
}

export async function createAdminZone(zoneData) {
  return axiosClient.post('/admin/zones', zoneData)
}

export async function updateAdminZone(zoneId, zoneData) {
  return axiosClient.patch(`/admin/zones/${zoneId}`, zoneData)
}

// Cattle
export async function getAdminCattle() {
  return axiosClient.get('/admin/cattle')
}

export async function createAdminCattle(cattleData) {
  return axiosClient.post('/admin/cattle', cattleData)
}

export async function updateAdminCattle(cattleId, cattleData) {
  return axiosClient.patch(`/admin/cattle/${cattleId}`, cattleData)
}

