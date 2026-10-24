import { z } from 'zod'

const integerId = z.coerce.number().int().positive()

export const slugParamsSchema = z.object({
  slug: z.string().trim().min(1),
})

export const productIdParamsSchema = z.object({ id: integerId })
export const variantIdParamsSchema = z.object({ id: integerId })

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(2000),
  imageUrl: z.string().trim().min(1).max(1000),
})

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(80),
  pricePaise: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
})

export const updateVariantSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  pricePaise: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})
