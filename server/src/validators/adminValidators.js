import { z } from 'zod'

const integerId = z.coerce.number().int().positive()
const cattleType = z.enum(['COW', 'BULL', 'CALF'])
const cowCategory = z.enum(['MILKING', 'DRY', 'PREGNANT', 'HEIFER'])

export const zoneIdParamsSchema = z.object({ id: integerId })

export const createZoneSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must contain exactly 6 digits'),
  areaName: z.string().trim().min(1).max(120),
  deliveryFeePaise: z.number().int().nonnegative(),
  isActive: z.boolean().optional(),
})

export const updateZoneSchema = createZoneSchema.partial()

const cattleFields = z.object({
  tagId: z.string().trim().min(1).max(80),
  type: cattleType,
  breed: z.string().trim().min(1).max(120),
  category: cowCategory.nullable().optional(),
  isActive: z.boolean().optional(),
})

function validateCattleCategory(value, context) {
  if (value.type === 'COW' && !value.category) {
    context.addIssue({ code: 'custom', message: 'Cows must have a category', path: ['category'] })
  }
  if (value.type !== 'COW' && value.category != null) {
    context.addIssue({ code: 'custom', message: 'Bulls and calves cannot have a category', path: ['category'] })
  }
}

export const createCattleSchema = cattleFields.superRefine(validateCattleCategory)
export const updateCattleSchema = cattleFields.partial().superRefine((value, context) => {
  if (value.type === 'COW' && value.category === undefined) {
    context.addIssue({ code: 'custom', message: 'A cow update must include a category', path: ['category'] })
  }
  if (value.type && value.type !== 'COW' && value.category != null) {
    context.addIssue({ code: 'custom', message: 'Bulls and calves cannot have a category', path: ['category'] })
  }
})

export const cattleIdParamsSchema = z.object({ id: integerId })
