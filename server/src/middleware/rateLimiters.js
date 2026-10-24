import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'

import { env } from '../config/env.js'
import { redis } from '../config/redis.js'

function disabledLimiter(request, response, next) {
  next()
}

function createLimiter({ windowMs, limit, keyGenerator }) {
  if (!env.RATE_LIMIT_ENABLED || env.NODE_ENV === 'test') return disabledLimiter

  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    handler: (request, response) => {
      response.status(429).json({ success: false, message: 'Too many requests, please try again later' })
    },
  })
}

export const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 10 })
export const apiLimiter = createLimiter({ windowMs: 60 * 1000, limit: 300 })
export const checkoutLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (request) => String(request.user?.id || request.ip),
})
