import http from 'node:http'
import process from 'node:process'

import { app } from './app.js'
import { env } from './config/env.js'
import { closePgPool } from './config/pg.js'
import { closeWorkers, startWorkers } from './queues/startWorkers.js'
import { scheduleReconciliation } from './queues/queues.js'
import { initSocket } from './sockets/index.js'

const port = env.PORT
const httpServer = http.createServer(app)
const io = initSocket(httpServer)
const workers = startWorkers()

scheduleReconciliation().catch((error) => {
  console.error(error)
})

// Dairy platform server entry point
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Dairy platform server listening on port ${port}`)
})

process.on('SIGTERM', async () => {
  await closeWorkers(workers)
  io.close()
  await closePgPool()
  httpServer.close()
})
