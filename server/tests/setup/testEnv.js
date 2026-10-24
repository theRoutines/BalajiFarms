import 'dotenv/config'
import process from 'node:process'

process.env.NODE_ENV = 'test'
process.env.RATE_LIMIT_ENABLED = 'false'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
