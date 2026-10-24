import bcrypt from 'bcryptjs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { closePgPool, withTransaction } from '../src/config/pg.js'

const users = [
  { name: 'Dairy Administrator', email: 'admin@dairy.test', phone: '9000000001', role: 'ADMIN' },
  { name: 'Delivery Partner', email: 'delivery@dairy.test', phone: '9000000002', role: 'DELIVERY' },
  { name: 'Demo Customer', email: 'customer@dairy.test', phone: '9000000003', role: 'CUSTOMER' },
]

const products = [
  {
    name: 'Pure Cow Ghee', slug: 'pure-cow-ghee', description: 'Traditional bilona-style cow ghee made in small batches.', imageUrl: '/images/ghee.jpg',
    variants: [{ sku: 'GHEE-250G', label: '250g', pricePaise: 32500, stock: 40 }, { sku: 'GHEE-500G', label: '500g', pricePaise: 60000, stock: 35 }, { sku: 'GHEE-1KG', label: '1kg', pricePaise: 110000, stock: 25 }],
  },
  {
    name: 'Cold-Pressed Mustard Oil', slug: 'cold-pressed-mustard-oil', description: 'Wood-pressed mustard oil with a bold, natural aroma.', imageUrl: '/images/mustard-oil.jpg',
    variants: [{ sku: 'MUSTARD-500ML', label: '500ml', pricePaise: 21000, stock: 50 }, { sku: 'MUSTARD-1L', label: '1L', pricePaise: 38000, stock: 45 }, { sku: 'MUSTARD-5L', label: '5L', pricePaise: 175000, stock: 20 }],
  },
  {
    name: 'Groundnut Oil', slug: 'groundnut-oil', description: 'Freshly pressed groundnut oil for everyday cooking.', imageUrl: '/images/groundnut-oil.jpg',
    variants: [{ sku: 'GROUNDNUT-500ML', label: '500ml', pricePaise: 23000, stock: 50 }, { sku: 'GROUNDNUT-1L', label: '1L', pricePaise: 42000, stock: 45 }, { sku: 'GROUNDNUT-5L', label: '5L', pricePaise: 195000, stock: 20 }],
  },
]

const zones = [
  ['110001', 'New Delhi', 0], ['122001', 'Gurugram', 2500], ['400001', 'Mumbai', 4500], ['500001', 'Hyderabad', 5000], ['560001', 'Bengaluru', 6000],
]

const breeds = ['Gir', 'Sahiwal', 'Rathi', 'Holstein Friesian']
const categories = ['MILKING', 'DRY', 'PREGNANT', 'HEIFER']

async function seedUser(client, user, passwordHash) {
  const result = await client.query(`
    INSERT INTO "User" ("name", "email", "phone", "passwordHash", "role")
    VALUES ($1, $2, $3, $4, $5::"Role")
    ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name", "phone" = EXCLUDED."phone", "passwordHash" = EXCLUDED."passwordHash", "role" = EXCLUDED."role"
    RETURNING "id"
  `, [user.name, user.email, user.phone, passwordHash, user.role])
  return result.rows[0].id
}

async function seedProduct(client, product) {
  const result = await client.query(`
    INSERT INTO "Product" ("name", "slug", "description", "imageUrl", "isActive")
    VALUES ($1, $2, $3, $4, true)
    ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "imageUrl" = EXCLUDED."imageUrl", "isActive" = true
    RETURNING "id"
  `, [product.name, product.slug, product.description, product.imageUrl])
  const productId = result.rows[0].id

  for (const variant of product.variants) {
    await client.query(`
      INSERT INTO "Variant" ("productId", "sku", "label", "pricePaise", "stock", "isActive")
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT ("sku") DO UPDATE SET "productId" = EXCLUDED."productId", "label" = EXCLUDED."label", "pricePaise" = EXCLUDED."pricePaise", "stock" = EXCLUDED."stock", "isActive" = true
    `, [productId, variant.sku, variant.label, variant.pricePaise, variant.stock])
  }
}

export async function seedSqlDatabase() {
  const passwordHash = await bcrypt.hash('Password123', 12)
  await withTransaction(async (client) => {
    for (const user of users) await seedUser(client, user, passwordHash)
    for (const product of products) await seedProduct(client, product)

    for (const [pincode, areaName, deliveryFeePaise] of zones) {
      await client.query(`
        INSERT INTO "DeliveryZone" ("pincode", "areaName", "deliveryFeePaise", "isActive")
        VALUES ($1, $2, $3, true)
        ON CONFLICT ("pincode") DO UPDATE SET "areaName" = EXCLUDED."areaName", "deliveryFeePaise" = EXCLUDED."deliveryFeePaise", "isActive" = true
      `, [pincode, areaName, deliveryFeePaise])
    }

    for (let index = 1; index <= 24; index += 1) {
      await client.query(`
        INSERT INTO "Cattle" ("tagId", "type", "breed", "category", "isActive")
        VALUES ($1, 'COW', $2, $3, true)
        ON CONFLICT ("tagId") DO UPDATE SET "type" = 'COW', "breed" = EXCLUDED."breed", "category" = EXCLUDED."category", "isActive" = true
      `, [`COW-${String(index).padStart(3, '0')}`, breeds[(index - 1) % breeds.length], categories[(index - 1) % categories.length]])
    }

    for (let index = 1; index <= 3; index += 1) {
      await client.query(`
        INSERT INTO "Cattle" ("tagId", "type", "breed", "category", "isActive")
        VALUES ($1, 'BULL', 'Gir', NULL, true)
        ON CONFLICT ("tagId") DO UPDATE SET "type" = 'BULL', "breed" = 'Gir', "category" = NULL, "isActive" = true
      `, [`BULL-${String(index).padStart(3, '0')}`])
    }

    for (let index = 1; index <= 6; index += 1) {
      await client.query(`
        INSERT INTO "Cattle" ("tagId", "type", "breed", "category", "isActive")
        VALUES ($1, 'CALF', $2, NULL, true)
        ON CONFLICT ("tagId") DO UPDATE SET "type" = 'CALF', "breed" = EXCLUDED."breed", "category" = NULL, "isActive" = true
      `, [`CALF-${String(index).padStart(3, '0')}`, breeds[(index - 1) % breeds.length]])
    }
  })
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  try {
    await seedSqlDatabase()
    process.stdout.write('SQL seed completed\n')
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await closePgPool()
  }
}

