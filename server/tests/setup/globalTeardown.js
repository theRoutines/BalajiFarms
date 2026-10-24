import { closePgPool } from '../../src/config/db.js'

export default async function globalTeardown() {
  await closePgPool()
}
