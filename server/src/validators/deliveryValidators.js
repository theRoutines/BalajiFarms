import { z } from 'zod'

export const pincodeQuerySchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must contain exactly 6 digits'),
})

export const completeDeliverySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must contain exactly 6 digits'),
})
