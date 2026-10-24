import bcrypt from 'bcryptjs'

import { env } from '../config/env.js'
import { query, withTransaction } from '../config/pg.js'
import { AppError } from '../utils/AppError.js'
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../utils/tokens.js'

function getSessionUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
}

async function createSession(user, client = null) {
  const accessToken = signAccessToken(user)
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  const runQuery = client ? client.query.bind(client) : query
  await runQuery(`
    INSERT INTO "RefreshToken" ("userId", "tokenHash", "expiresAt")
    VALUES ($1, $2, $3)
  `, [user.id, hashToken(refreshToken), expiresAt])

  return { user: getSessionUser(user), accessToken, refreshToken }
}

export async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 12)
  const result = await query(`
    INSERT INTO "User" ("name", "email", "phone", "passwordHash", "role")
    VALUES ($1, $2, $3, $4, 'CUSTOMER')
    RETURNING "id", "name", "email", "phone", "role"
  `, [input.name, input.email, input.phone, passwordHash])

  return { user: result.rows[0] }
}

export async function loginUser(input) {
  const result = await query(`
    SELECT "id", "name", "email", "phone", "role", "passwordHash"
    FROM "User"
    WHERE "email" = $1
  `, [input.email])
  const user = result.rows[0]
  const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401)
  }

  return createSession(user)
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) throw new AppError('Refresh session required', 401)

  const result = await query(`
    SELECT rt."id" AS "tokenId", rt."userId", rt."expiresAt" AS "tokenExpiresAt", rt."revokedAt" AS "tokenRevokedAt",
           u."id", u."name", u."email", u."phone", u."role"
    FROM "RefreshToken" rt
    JOIN "User" u ON u."id" = rt."userId"
    WHERE rt."tokenHash" = $1
  `, [hashToken(refreshToken)])
  const storedToken = result.rows[0]

  if (!storedToken) throw new AppError('Refresh session required', 401)

  if (storedToken.tokenRevokedAt) {
    await withTransaction(async (client) => {
      await client.query('UPDATE "RefreshToken" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "revokedAt" IS NULL', [storedToken.userId])
    })
    throw new AppError('Refresh session has expired', 401)
  }

  if (storedToken.tokenExpiresAt <= new Date()) throw new AppError('Refresh session has expired', 401)

  return withTransaction(async (client) => {
    const revoked = await client.query(`
      UPDATE "RefreshToken"
      SET "revokedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1 AND "revokedAt" IS NULL
      RETURNING "id"
    `, [storedToken.tokenId])
    if (revoked.rowCount === 0) {
      throw new AppError('Refresh session has expired', 401)
    }
    return createSession(storedToken, client)
  })
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) return

  await query('UPDATE "RefreshToken" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "tokenHash" = $1 AND "revokedAt" IS NULL', [hashToken(refreshToken)])
}
