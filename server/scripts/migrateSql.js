import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { closePgPool, query, withTransaction } from '../src/config/pg.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const migrationDirectory = path.resolve(scriptDirectory, '../sql/migrations')

async function ensureMigrationTable() {
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
}

async function hasExistingApplicationSchema() {
  const result = await query(`
    SELECT to_regclass('public."User"') IS NOT NULL AS "hasUserTable",
           to_regclass('public."Order"') IS NOT NULL AS "hasOrderTable"
  `)
  return result.rows[0].hasUserTable && result.rows[0].hasOrderTable
}

export async function runSqlMigrations() {
  await ensureMigrationTable()
  const filenames = (await fs.readdir(migrationDirectory))
    .filter((filename) => filename.endsWith('.sql'))
    .sort()

  let checkedForBaseline = false
  for (const filename of filenames) {
    const existing = await query('SELECT filename FROM schema_migrations WHERE filename = $1', [filename])
    if (existing.rowCount > 0) continue

    // The first SQL migration matches the existing application schema; record it instead of recreating the database.
    if (!checkedForBaseline && filename === '001_init.sql') {
      checkedForBaseline = true
      if (await hasExistingApplicationSchema()) {
        await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
        process.stdout.write(`Baselined existing SQL schema with ${filename}\n`)
        continue
      }
    }

    const migrationSql = await fs.readFile(path.join(migrationDirectory, filename), 'utf8')
    await withTransaction(async (client) => {
      await client.query(migrationSql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
    })
    process.stdout.write(`Applied SQL migration ${filename}\n`)
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  try {
    await runSqlMigrations()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await closePgPool()
  }
}

