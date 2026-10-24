import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { app } from '../src/app.js'
import { createUser, loginAs, resetDatabase } from './setup/testHelpers.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('Admin Image Upload endpoint', () => {
  it('rejects unauthenticated requests with 401', async () => {
    await request(app)
      .post('/api/admin/upload')
      .send({
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      })
      .expect(401)
  })

  it('rejects non-admin users with 403', async () => {
    const customerAgent = await loginAs(await createUser('CUSTOMER'))
    await customerAgent
      .post('/api/admin/upload')
      .send({
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      })
      .expect(403)
  })

  it('rejects empty or invalid payloads with 400', async () => {
    const adminAgent = await loginAs(await createUser('ADMIN'))
    await adminAgent.post('/api/admin/upload').send({}).expect(400)

    await adminAgent.post('/api/admin/upload').send({ image: 'not-base64' }).expect(400)
  })

  it('successfully uploads an image for admin and returns image url', async () => {
    const adminAgent = await loginAs(await createUser('ADMIN'))
    const valid1x1Png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const response = await adminAgent
      .post('/api/admin/upload')
      .send({ image: valid1x1Png })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.url).toBeDefined()
    expect(typeof response.body.data.url).toBe('string')
  })
})

