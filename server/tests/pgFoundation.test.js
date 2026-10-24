import { describe, expect, it } from 'vitest'

import { query, withTransaction } from '../src/config/pg.js'

describe('PostgreSQL foundation', () => {
  it('connects to the configured local PostgreSQL database', async () => {
    const result = await query('SELECT current_database() AS database_name, current_schema() AS schema_name')

    expect(result.rows[0].database_name).toBe('dairy_test')
    expect(result.rows[0].schema_name).toBe('public')
  })

  it('commits work returned by the transaction callback', async () => {
    const result = await withTransaction(async (client) => {
      return client.query('SELECT 1 + 1 AS result')
    })

    expect(result.rows[0].result).toBe(2)
  })

  it('rolls back and rethrows callback failures', async () => {
    await expect(withTransaction(async () => {
      throw new Error('phase-one rollback check')
    })).rejects.toThrow('phase-one rollback check')
  })
})

