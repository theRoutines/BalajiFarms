import pg from 'pg'

import { env } from './env.js'

const { Pool } = pg

const isRemoteDb =
  env.DATABASE_URL.includes('supabase.co') ||
  env.DATABASE_URL.includes('pooler.supabase.com') ||
  env.NODE_ENV === 'production'

// One shared pool is used by request handlers, workers, and tests.
export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
})

export function query(text, values) {
  return pgPool.query(text, values)
}

export async function withTransaction(callback) {
  const client = await pgPool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export function closePgPool() {
  return pgPool.end()
}
