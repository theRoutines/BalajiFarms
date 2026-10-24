import crypto from 'node:crypto'

import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { app } from '../src/app.js'
import { createCattleRows, createUser, loginAs, resetDatabase } from './setup/testHelpers.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('Phase 3 SQL-backed services', () => {
  it('preserves registration, duplicate handling, refresh, and logout', async () => {
    const input = { name: 'SQL Customer', email: 'sql-customer@test.example', phone: '9111111111', password: 'Password123' }
    await request(app).post('/api/auth/register').send(input).expect(201)
    await request(app).post('/api/auth/register').send(input).expect(409)

    const agent = request.agent(app)
    await agent.post('/api/auth/login').send({ email: input.email, password: input.password }).expect(200)
    await agent.get('/api/auth/me').expect(200)
    await agent.post('/api/auth/refresh').expect(200)
    await agent.post('/api/auth/logout').expect(200)
  })

  it('preserves catalog and admin product responses', async () => {
    const adminAgent = await loginAs(await createUser('ADMIN'))
    const slug = `sql-product-${crypto.randomUUID()}`
    const created = await adminAgent.post('/api/admin/products').send({
      name: 'SQL Product', slug, description: 'Created through the SQL-backed service', imageUrl: '/sql.jpg',
    }).expect(201)
    expect(created.body.data.product.variants).toEqual([])

    const variant = await adminAgent.post(`/api/admin/products/${created.body.data.product.id}/variants`).send({
      sku: `SQL-${crypto.randomUUID()}`, label: '500g', pricePaise: 12500, stock: 10,
    }).expect(201)
    expect(variant.body.data.variant.pricePaise).toBe(12500)

    await adminAgent.patch(`/api/admin/products/${created.body.data.product.id}`).send({ name: 'Updated SQL Product' }).expect(200)
    const storefront = await request(app).get(`/api/products/${slug}`).expect(200)
    expect(storefront.body.data.product.name).toBe('Updated SQL Product')
    expect(storefront.body.data.product.variants).toHaveLength(1)

    await adminAgent.delete(`/api/admin/products/${created.body.data.product.id}`).expect(200)
    await request(app).get(`/api/products/${slug}`).expect(404)
  })

  it('preserves zone administration and herd statistics', async () => {
    const adminAgent = await loginAs(await createUser('ADMIN'))
    const zone = await adminAgent.post('/api/admin/zones').send({
      pincode: '110001', areaName: 'SQL Area', deliveryFeePaise: 1500, isActive: true,
    }).expect(201)
    await adminAgent.patch(`/api/admin/zones/${zone.body.data.zone.id}`).send({ deliveryFeePaise: 2000 }).expect(200)
    const check = await request(app).get('/api/delivery/check').query({ pincode: '110001' }).expect(200)
    expect(check.body.data.deliveryFeePaise).toBe(2000)

    await createCattleRows([
      { tagId: 'SQL-COW-001', type: 'COW', breed: 'Gir', category: 'MILKING' },
      { tagId: 'SQL-COW-002', type: 'COW', breed: 'Gir', category: 'DRY' },
      { tagId: 'SQL-BULL-001', type: 'BULL', breed: 'Gir', category: null },
      { tagId: 'SQL-CALF-001', type: 'CALF', breed: 'Rathi', category: null },
    ])
    const added = await adminAgent.post('/api/admin/cattle').send({
      tagId: 'SQL-COW-003', type: 'COW', breed: 'Sahiwal', category: 'PREGNANT', isActive: true,
    }).expect(201)
    await adminAgent.patch(`/api/admin/cattle/${added.body.data.animal.id}`).send({ isActive: false }).expect(200)
    const stats = await request(app).get('/api/herd/stats').expect(200)
    expect(stats.body.data).toMatchObject({ total: 4, cows: 2, bulls: 1, calves: 1, milkingCows: 1 })
    expect(stats.body.data.byBreed).toEqual([{ breed: 'Gir', count: 3 }, { breed: 'Rathi', count: 1 }])
  })
})

