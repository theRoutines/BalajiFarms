import { z } from 'zod'

const integerId = z.coerce.number().int().positive()

const shippingAddressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^\d{10}$/, 'Phone must contain exactly 10 digits'),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must contain exactly 6 digits'),
})

export const checkoutSchema = z.object({
  items: z.array(z.object({
    variantId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(10).superRefine((items, context) => {
    const variantIds = items.map((item) => item.variantId)
    if (new Set(variantIds).size !== variantIds.length) {
      context.addIssue({ code: 'custom', message: 'Each variant may appear only once', path: ['items'] })
    }
  }),
  shippingAddress: shippingAddressSchema,
})

export const idempotencyHeaderSchema = z.object({
  'idempotency-key': z.string().min(8).max(64),
})

export const orderIdParamsSchema = z.object({ id: integerId })

export const adminOrderQuerySchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'EXPIRED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
})
