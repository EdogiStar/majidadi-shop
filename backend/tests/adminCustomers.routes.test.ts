import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { AdminCustomersService } from '../src/services/adminCustomers.service.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')

const registeredId = '11111111-1111-1111-1111-111111111111'
const customer = {
  id: registeredId,
  full_name: 'Test Customer',
  email: 'test@example.com',
  phone: '+2348000000000',
  role: 'customer' as const,
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: '2026-10-01T12:00:00.000Z',
}
const customerOrders = [{
  orderNumber: 'MJD-M4ABC-1234ABCD',
  status: 'delivered',
  paymentStatus: 'paid',
  totalAmount: 12000,
  fulfillment: { method: 'pickup' as const },
  createdAt: '2026-10-02T12:00:00.000Z',
}]

let lastFilters: unknown
const fakeService: AdminCustomersService = {
  list: async (filters) => {
    lastFilters = filters
    return { customers: [customer], page: filters.page, pageSize: filters.pageSize, total: 1 }
  },
  find: async (id) => id === registeredId ? { customer, orders: customerOrders } : null,
}

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
  }, undefined, undefined, undefined, undefined, fakeService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

const adminHeaders = { authorization: ['Bearer', 'admin-token'].join(' ') }

test('customer list is protected by authentication and the server-side admin role', async () => {
  const unauthenticated = await fetch(`${baseUrl}/api/admin/customers`)
  assert.equal(unauthenticated.status, 401)

  const customerResponse = await fetch(`${baseUrl}/api/admin/customers`, {
    headers: { authorization: ['Bearer', 'customer-token'].join(' ') },
  })
  assert.equal(customerResponse.status, 403)

  const adminResponse = await fetch(`${baseUrl}/api/admin/customers`, { headers: adminHeaders })
  assert.equal(adminResponse.status, 200)
})

test('customer list passes server-side search and role filters through to the directory query', async () => {
  for (const [query, expectedSearch] of [
    ['search=Test%20Customer', 'Test Customer'],
    ['search=test%40example.com', 'test@example.com'],
    ['search=%2B2348000000000', '+2348000000000'],
    ['role=admin', undefined],
  ] as const) {
    const response = await fetch(`${baseUrl}/api/admin/customers?${query}&page=2&pageSize=10`, {
      headers: adminHeaders,
    })
    assert.equal(response.status, 200)
    assert.deepEqual(lastFilters, {
      ...(expectedSearch ? { search: expectedSearch } : {}),
      ...(query === 'role=admin' ? { role: 'admin' } : {}),
      page: 2,
      pageSize: 10,
    })
  }
})

test('invalid role filters are rejected', async () => {
  const response = await fetch(`${baseUrl}/api/admin/customers?role=owner`, { headers: adminHeaders })
  assert.equal(response.status, 400)
})

test('customer detail contains safe profile fields and registered order history', async () => {
  const response = await fetch(`${baseUrl}/api/admin/customers/${registeredId}`, { headers: adminHeaders })
  assert.equal(response.status, 200)
  const body = await response.json() as Record<string, unknown>
  assert.deepEqual(body, { customer, orders: customerOrders })
  const serialized = JSON.stringify(body)
  for (const secretKey of ['password', 'access_token', 'refresh_token', 'service_role', 'app_metadata', 'user_metadata']) {
    assert.equal(serialized.includes(secretKey), false)
  }
})

test('client-supplied administrator role cannot bypass customer authorization', async () => {
  const response = await fetch(`${baseUrl}/api/admin/customers?role=admin`, {
    headers: {
      authorization: ['Bearer', 'customer-token'].join(' '),
      'x-user-role': 'admin',
    },
  })
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { error: 'Administrator access required' })
})

test('missing customer returns not found', async () => {
  const response = await fetch(`${baseUrl}/api/admin/customers/22222222-2222-2222-2222-222222222222`, {
    headers: adminHeaders,
  })
  assert.equal(response.status, 404)
})
