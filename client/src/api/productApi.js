import axiosClient from './axiosClient.js'

export async function getProducts() {
  return axiosClient.get('/products')
}

export async function getProductBySlug(slug) {
  return axiosClient.get(`/products/${encodeURIComponent(slug)}`)
}

