import * as catalogService from '../services/catalogService.js'

export async function listProducts(request, response) {
  const products = await catalogService.listProducts()
  response.json({ success: true, data: { products } })
}

export async function getProduct(request, response) {
  const product = await catalogService.getProductBySlug(request.params.slug)
  response.json({ success: true, data: { product } })
}

export async function listAdminProducts(request, response) {
  const products = await catalogService.listAllProducts()
  response.json({ success: true, data: { products } })
}

export async function createProduct(request, response) {
  const product = await catalogService.createProduct(request.body)
  response.status(201).json({ success: true, data: { product } })
}

export async function updateProduct(request, response) {
  const product = await catalogService.updateProduct(request.params.id, request.body)
  response.json({ success: true, data: { product } })
}

export async function createVariant(request, response) {
  const variant = await catalogService.createVariant(request.params.id, request.body)
  response.status(201).json({ success: true, data: { variant } })
}

export async function updateVariant(request, response) {
  const variant = await catalogService.updateVariant(request.params.id, request.body)
  response.json({ success: true, data: { variant } })
}

export async function deleteProduct(request, response) {
  const product = await catalogService.deleteProduct(request.params.id)
  response.json({ success: true, data: { product } })
}
