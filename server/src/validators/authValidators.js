import { z } from 'zod'

const emailSchema = z.string().trim().email().transform((email) => email.toLowerCase())
const phoneSchema = z.string().regex(/^\d{10}$/, 'Phone must contain exactly 10 digits')
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number')

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})
