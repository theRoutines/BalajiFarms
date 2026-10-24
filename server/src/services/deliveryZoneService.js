import { query } from '../config/pg.js'
import { AppError } from '../utils/AppError.js'

const zoneColumns = '"id", "pincode", "areaName", "deliveryFeePaise", "isActive"'

export async function checkPincode(pincode) {
  const result = await query(`SELECT ${zoneColumns} FROM "DeliveryZone" WHERE "pincode" = $1 AND "isActive" = true`, [pincode])
  if (result.rowCount === 0) throw new AppError('We do not deliver to this pincode yet', 404)
  return result.rows[0]
}

export async function listZones() {
  const result = await query(`SELECT ${zoneColumns} FROM "DeliveryZone" ORDER BY "id" ASC`)
  return result.rows
}

export async function createZone(input) {
  const result = await query(`
    INSERT INTO "DeliveryZone" ("pincode", "areaName", "deliveryFeePaise", "isActive")
    VALUES ($1, $2, $3, $4)
    RETURNING ${zoneColumns}
  `, [input.pincode, input.areaName, input.deliveryFeePaise, input.isActive ?? true])
  return result.rows[0]
}

export async function updateZone(zoneId, input) {
  if (Object.keys(input).length === 0) throw new AppError('At least one zone field is required', 400)

  const fields = ['pincode', 'areaName', 'deliveryFeePaise', 'isActive'].filter((field) => Object.hasOwn(input, field))
  const values = fields.map((field) => input[field])
  const assignments = fields.map((field, index) => `"${field}" = $${index + 1}`)
  const result = await query(`UPDATE "DeliveryZone" SET ${assignments.join(', ')} WHERE "id" = $${values.length + 1} RETURNING ${zoneColumns}`, [...values, zoneId])
  if (result.rowCount === 0) throw new AppError('Delivery zone not found', 404)
  return result.rows[0]
}
