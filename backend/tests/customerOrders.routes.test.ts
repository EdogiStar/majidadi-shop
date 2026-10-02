import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { User } from '@supabase/supabase-js'
import type { PaymentService } from '../src/services/payment.service.js'
import type { CustomerOrdersService } from '../src/services/customerOrders.service.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')

let queriedUserId = ''
const ordersService: CustomerOrdersService = {
  list: async (userId) => {
    queriedUserId = userId
    return []
  },
  find: async (userId, orderNumber) => {
    queriedUserId = userId
    if (userId !== 'verified-customer-id' || orderNumber !== 'MJD-TEST-00000000') return null
    return {
      orderNumber,
      status: 'processing',
      paymentStatus: 'paid',
      totalAmount: 100,
      fulfillment: { method: 'pickup' },
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [{ name: 'Product', quantity: 1, unitPrice: 100, total: 100 }],
    }
  },
}

const paymentService: PaymentService = {
  initialize: async () => ({ authorizationUrl: '', reference: '', orderNumber: '' }),
  verify: async () => ({ verified: false, message: '' }),
}

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  const app = createApp(undefined, {
    verifyAccessToken: async (token) => token === 'verified-customer-token'
      ? { id: 'verified-customer-id' } as User
      : null,
  }, paymentService, undefined, ordersService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('customer order list requires a verified session', async () => {
  const response = await fetch(`${baseUrl}/api/orders`)
  assert.equal(response.status, 401)
})

test('customer order queries use the verified identity, not a client-provided user_id', async () => {
  const response = await fetch(`${baseUrl}/api/orders?user_id=another-customer-id`, {
    headers: { authorization: 'Bearer verified-customer-token' },
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { orders: [] })
  assert.equal(queriedUserId, 'verified-customer-id')
})

test('customer order detail returns only matching owned order data without internal identifiers', async () => {
  const response = await fetch(`${baseUrl}/api/orders/MJD-TEST-00000000`, {
    headers: { authorization: 'Bearer verified-customer-token' },
  })
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.deepEqual(payload, {
    order: {
      orderNumber: 'MJD-TEST-00000000',
      status: 'processing',
      paymentStatus: 'paid',
      totalAmount: 100,
      fulfillment: { method: 'pickup' },
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [{ name: 'Product', quantity: 1, unitPrice: 100, total: 100 }],
    },
  })
  assert.equal(JSON.stringify(payload).includes('"id"'), false)
  assert.equal(queriedUserId, 'verified-customer-id')
})

test('customer cannot retrieve another account order by changing its order number', async () => {
  const response = await fetch(`${baseUrl}/api/orders/MJD-OTHER-00000000`, {
    headers: { authorization: 'Bearer verified-customer-token' },
  })
  assert.equal(response.status, 404)
  assert.equal(queriedUserId, 'verified-customer-id')
})
