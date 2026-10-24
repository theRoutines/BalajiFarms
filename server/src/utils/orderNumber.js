import crypto from 'node:crypto'

export function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const randomPart = crypto.randomBytes(4).toString('base64url').replaceAll('-', 'A').replaceAll('_', 'B').slice(0, 5).toUpperCase()
  return `DM-${datePart}-${randomPart}`
}
