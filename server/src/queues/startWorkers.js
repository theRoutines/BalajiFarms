import { createEmailWorker } from './emailWorker.js'
import { createExpiryWorker } from './expiryWorker.js'
import { createReconciliationWorker } from './reconciliationWorker.js'

export function startWorkers() {
  const workers = [createEmailWorker(), createExpiryWorker(), createReconciliationWorker()]
  for (const worker of workers) {
    worker.on('failed', (job, error) => {
      console.error(`Queue job ${job?.id || 'unknown'} failed`, error)
    })
  }
  return workers
}

export async function closeWorkers(workers) {
  await Promise.all(workers.map((worker) => worker.close()))
}
