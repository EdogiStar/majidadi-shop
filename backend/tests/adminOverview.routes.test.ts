import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { AdminOverviewService } from '../src/services/adminOverview.service.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')

const overview = {
  totalRevenue: 1250,
  paidOrderCount: 2,
  orders: { total: 5, pending: 1, processing: 1, shipped: 1, delivered: 1, cancelled: 1 },
  products: { total: 4, active: 3, inactive: 1, lowStock: 2 },
  registeredCustomers: 3,
  recentOrders: [{
    id: '11111111-1111-1111-1111-111111111111',
    orderNumber: 'MJD-M4ABC-1234ABCD',
    customerName: 'Guest',
    customerType: 'guest' as const,
    totalAmount: 250,
    status: 'pending' as const,
    paymentStatus: 'failed' as const,
    createdAt: '2026-10-01T12:00:00.000Z',
  }],
}
const fakeService: AdminOverviewService = { get: async () => overview }

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  const app = createApp(undefined, {
    verifyAccessToken: async (token) => token === 'admin-token'
      ? { id: 'admin-user', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
      : token === 'customer-token'
        ? { id: 'customer-user', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
        : null,
    isAdmin: async (userId) => userId === 'admin-user',
  }, undefined, undefined, undefined, undefined, undefined, fakeService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('overview requires authentication and server-confirmed admin role', async () => {
  const unauthenticated = await fetch(`${baseUrl}/api/admin/overview`)
  assert.equal(unauthenticated.status, 401)

  const customer = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { authorization: ['Bearer', 'customer-token'].join(' ') },
  })
  assert.equal(customer.status, 403)

  const bypassAttempt = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: {
      authorization: ['Bearer', 'customer-token'].join(' '),
      'x-user-role': 'admin',
    },
  })
  assert.equal(bypassAttempt.status, 403)
})

test('admin overview returns aggregate metrics and recent guest orders', async () => {
  const response = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { authorization: ['Bearer', 'admin-token'].join(' ') },
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), overview)
})
