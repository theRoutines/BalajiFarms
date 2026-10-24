import { query } from '../config/pg.js'
import { AppError } from '../utils/AppError.js'

const categoryNames = ['MILKING', 'DRY', 'PREGNANT', 'HEIFER']
const cattleColumns = '"id", "tagId", "type", "breed", "category", "isActive", "createdAt"'

export async function getHerdStats() {
  const [totalResult, typeResult, categoryResult, breedResult] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM "Cattle" WHERE "isActive" = true'),
    query('SELECT "type", COUNT(*)::int AS count FROM "Cattle" WHERE "isActive" = true GROUP BY "type"'),
    query('SELECT "category", COUNT(*)::int AS count FROM "Cattle" WHERE "isActive" = true AND "type" = \'COW\' GROUP BY "category"'),
    query('SELECT "breed", COUNT(*)::int AS count FROM "Cattle" WHERE "isActive" = true GROUP BY "breed"'),
  ])

  const countsByType = Object.fromEntries(typeResult.rows.map((group) => [group.type, group.count]))
  const countsByCategory = Object.fromEntries(categoryNames.map((category) => [category, 0]))
  for (const group of categoryResult.rows) {
    if (group.category) countsByCategory[group.category] = group.count
  }

  const byBreed = breedResult.rows
    .map((group) => ({ breed: group.breed, count: group.count }))
    .sort((first, second) => first.breed.localeCompare(second.breed))

  return {
    total: totalResult.rows[0].count,
    cows: countsByType.COW || 0,
    bulls: countsByType.BULL || 0,
    calves: countsByType.CALF || 0,
    milkingCows: countsByCategory.MILKING,
    byCategory: countsByCategory,
    byBreed,
  }
}

export async function listCattle() {
  const result = await query(`SELECT ${cattleColumns} FROM "Cattle" ORDER BY "id" ASC`)
  return result.rows
}

export async function addCattle(input) {
  const result = await query(`
    INSERT INTO "Cattle" ("tagId", "type", "breed", "category", "isActive")
    VALUES ($1, $2::"CattleType", $3, $4::"CowCategory", $5)
    RETURNING ${cattleColumns}
  `, [input.tagId, input.type, input.breed, input.category ?? null, input.isActive ?? true])
  return result.rows[0]
}

export async function updateCattle(cattleId, input) {
  const existingResult = await query(`SELECT ${cattleColumns} FROM "Cattle" WHERE "id" = $1`, [cattleId])
  if (existingResult.rowCount === 0) throw new AppError('Cattle record not found', 404)
  const existing = existingResult.rows[0]

  const nextType = input.type || existing.type
  const nextCategory = input.category === undefined ? existing.category : input.category

  if (nextType === 'COW' && !nextCategory) {
    throw new AppError('Cows must have a category', 400)
  }
  if (nextType !== 'COW' && nextCategory != null) {
    throw new AppError('Bulls and calves cannot have a category', 400)
  }

  const fields = ['tagId', 'type', 'breed', 'isActive'].filter((field) => Object.hasOwn(input, field))
  const values = fields.map((field) => input[field])
  const assignments = fields.map((field, index) => {
    const cast = field === 'type' ? '::"CattleType"' : ''
    return `"${field}" = $${index + 1}${cast}`
  })
  values.push(nextCategory === undefined ? null : nextCategory)
  assignments.push(`"category" = $${values.length}::"CowCategory"`)

  const result = await query(`UPDATE "Cattle" SET ${assignments.join(', ')} WHERE "id" = $${values.length + 1} RETURNING ${cattleColumns}`, [...values, cattleId])
  return result.rows[0]
}
