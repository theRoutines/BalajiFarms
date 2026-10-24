import 'dotenv/config'

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

export default function globalSetup() {
  const migrationScript = fileURLToPath(new URL('../../scripts/migrateSql.js', import.meta.url))
  execFileSync(process.execPath, [migrationScript], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: 'inherit',
  })
}
