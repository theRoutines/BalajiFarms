import crypto from 'node:crypto'

import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'

function cookieOptions(path = '/') {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path,
  }
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: `${env.ACCESS_TOKEN_MINUTES}m` },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET)
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function setAuthCookies(response, accessToken, refreshToken) {
  response.cookie('accessToken', accessToken, cookieOptions('/'))
  response.cookie('refreshToken', refreshToken, cookieOptions('/api/auth'))
}

export function clearAuthCookies(response) {
  response.clearCookie('accessToken', cookieOptions('/'))
  response.clearCookie('refreshToken', cookieOptions('/api/auth'))
}
