import { AppError } from '../utils/AppError.js'
import { query } from '../config/pg.js'

const productFields = `
  p."id" AS "id", p."name" AS "name", p."slug" AS "slug", p."description" AS "description", p."imageUrl" AS "imageUrl", p."isActive" AS "isActive",
  v."id" AS "variantId", v."productId" AS "variantProductId", v."sku" AS "sku", v."label" AS "label", v."pricePaise" AS "pricePaise", v."stock" AS "stock", v."isActive" AS "variantIsActive"
`

function mapVariant(row) {
  return { id: row.variantId, productId: row.variantProductId, sku: row.sku, label: row.label, pricePaise: row.pricePaise, stock: row.stock, isActive: row.variantIsActive }
}

function mapProducts(rows) {
  const products = []
  const productsById = new Map()
  for (const row of rows) {
    let product = productsById.get(row.id)
    if (!product) {
      product = { id: row.id, name: row.name, slug: row.slug, description: row.description, imageUrl: row.imageUrl, isActive: row.isActive, variants: [] }
      productsById.set(row.id, product)
      products.push(product)
    }
    if (row.variantId !== null) product.variants.push(mapVariant(row))
  }
  return products
}

async function findProductRows({ activeProducts, activeVariants, slug }) {
  const filters = []
  const values = []
  if (activeProducts) filters.push('p."isActive" = true')
  if (activeVariants) filters.push('(v."isActive" = true OR v."id" IS NULL)')
  if (slug !== undefined) {
    values.push(slug)
    filters.push(`p."slug" = $${values.length}`)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const result = await query(`
    SELECT ${productFields}
    FROM "Product" p
    LEFT JOIN "Variant" v ON v."productId" = p."id"${activeVariants ? ' AND v."isActive" = true' : ''}
    ${where}
    ORDER BY p."id" ASC, v."id" ASC
  `, values)
  return result.rows
}

export async function listProducts() {
  return mapProducts(await findProductRows({ activeProducts: true, activeVariants: true }))
}

export async function getProductBySlug(slug) {
  const products = mapProducts(await findProductRows({ activeProducts: true, activeVariants: true, slug }))
  if (products.length === 0) throw new AppError('Product not found', 404)
  return products[0]
}

export async function listAllProducts() {
  return mapProducts(await findProductRows({ activeProducts: false, activeVariants: false }))
}

export async function createProduct(input) {
  const result = await query(`
    INSERT INTO "Product" ("name", "slug", "description", "imageUrl")
    VALUES ($1, $2, $3, $4)
    RETURNING "id", "name", "slug", "description", "imageUrl", "isActive"
  `, [input.name, input.slug, input.description, input.imageUrl])
  return { ...result.rows[0], variants: [] }
}

async function findProductWithVariants(productId) {
  const rows = await findProductRows({ activeProducts: false, activeVariants: false })
  const product = mapProducts(rows).find((item) => item.id === productId)
  if (!product) throw new AppError('Product not found', 404)
  return product
}

export async function updateProduct(productId, input) {
  const fields = ['name', 'slug', 'description', 'imageUrl', 'isActive'].filter((field) => Object.hasOwn(input, field))
  if (fields.length > 0) {
    const values = fields.map((field) => input[field])
    const assignments = fields.map((field, index) => `"${field}" = $${index + 1}`)
    const result = await query(`UPDATE "Product" SET ${assignments.join(', ')} WHERE "id" = $${values.length + 1} RETURNING "id"`, [...values, productId])
    if (result.rowCount === 0) throw new AppError('Product not found', 404)
  }
  return findProductWithVariants(productId)
}

export async function createVariant(productId, input) {
  const product = await query('SELECT "id" FROM "Product" WHERE "id" = $1', [productId])
  if (product.rowCount === 0) throw new AppError('Product not found', 404)
  const result = await query(`
    INSERT INTO "Variant" ("productId", "sku", "label", "pricePaise", "stock")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING "id", "productId", "sku", "label", "pricePaise", "stock", "isActive"
  `, [productId, input.sku, input.label, input.pricePaise, input.stock])
  return result.rows[0]
}

export async function updateVariant(variantId, input) {
  if (Object.keys(input).length === 0) throw new AppError('At least one variant field is required', 400)
  const fields = ['label', 'pricePaise', 'stock', 'isActive'].filter((field) => Object.hasOwn(input, field))
  const values = fields.map((field) => input[field])
  const assignments = fields.map((field, index) => `"${field}" = $${index + 1}`)
  const result = await query(`UPDATE "Variant" SET ${assignments.join(', ')} WHERE "id" = $${values.length + 1} RETURNING "id", "productId", "sku", "label", "pricePaise", "stock", "isActive"`, [...values, variantId])
  if (result.rowCount === 0) throw new AppError('Variant not found', 404)
  return result.rows[0]
}

export async function deleteProduct(productId) {
  const result = await query('DELETE FROM "Product" WHERE "id" = $1 RETURNING "id", "name"', [productId])
  if (result.rowCount === 0) throw new AppError('Product not found', 404)
  return result.rows[0]
}
