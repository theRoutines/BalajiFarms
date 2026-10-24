import { createAdapter } from '@socket.io/redis-adapter'
import { parse } from 'cookie'
import { Server } from 'socket.io'

import { env } from '../config/env.js'
import { query } from '../config/pg.js'
import { createRedisConnection } from '../config/redis.js'
import { verifyAccessToken } from '../utils/tokens.js'
import { setIo } from './socketEmitter.js'

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  })
  const pubClient = createRedisConnection()
  const subClient = createRedisConnection()
  io.adapter(createAdapter(pubClient, subClient))

  io.use(async (socket, next) => {
    try {
      const cookies = parse(socket.handshake.headers.cookie || '')
      if (!cookies.accessToken) throw new Error('Authentication required')
      const payload = verifyAccessToken(cookies.accessToken)
      const result = await query(`
        SELECT "id", "name", "email", "role"
        FROM "User"
        WHERE "id" = $1
      `, [Number(payload.sub)])
      if (result.rowCount === 0) throw new Error('Authentication required')
      socket.user = result.rows[0]
      next()
    } catch (error) {
      next(new Error('Authentication required'))
    }
  })

  io.on('connection', (socket) => {
    const { id, role } = socket.user
    socket.join(`user:${id}`)
    if (role === 'ADMIN') socket.join('staff:admin')
    if (role === 'DELIVERY') socket.join('staff:delivery')
  })

  setIo(io)
  return io
}

