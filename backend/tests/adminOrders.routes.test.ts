import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { AdminOrdersService } from '../src/services/adminOrders.service.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')

const guestOrder = {
  id: '11111111-1111-1111-1111-111111111111',
  orderNumber: 'MJD-M4ABC-1234ABCD',
  customerType: 'guest' as const,
  customerName: 'Guest Customer',
  customerEmail: 'guest@example.com',
  customerPhone: '+2348000000000',
  totalAmount: 260000,
  status: 'pending' as const,
  paymentStatus: 'pending' as const,
  paymentReference: 'majidadi-11111111-1111-1111-1111-111111111111',
  fulfillment: { method: 'delivery' as const, address: '1 Test Road', city: 'Abuja', state: 'FCT' },
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  items: [{ name: 'Snapshot Laptop', unitPrice: 250000, quantity: 1, subtotal: 250000 }],
}

const registeredOrder = {
  ...guestOrder,
  id: '22222222-2222-2222-2222-222222222222',
  orderNumber: 'MJD-M4ABC-2345ABCD',
  customerType: 'registered' as const,
  customerName: 'Registered Customer',
}

let lastOrderFilters: unknown
const fakeAdminOrdersService: AdminOrdersService = {
  list: async (filters) => {
    lastOrderFilters = filters
    return {
      orders: [guestOrder, registeredOrder]
        .filter((order) => (!filters.status || order.status === filters.status)
          && (!filters.paymentStatus || order.paymentStatus === filters.paymentStatus))
        .map(({ items: _items, ...summary }) => summary),
      page: filters.page,
      pageSize: filters.pageSize,
      total: 2,
    }
  },
  find: async (id) => [guestOrder, registeredOrder].find((order) => order.id === id) ?? null,
  updateStatus: async (id, status) => {
    const order = [guestOrder, registeredOrder].find((item) => item.id === id)
    return order ? { ...order, status } : null
  },
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
  }, undefined, undefined, undefined, fakeAdminOrdersService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

const adminHeaders = { authorization: ['Bearer', 'admin-token'].join(' ') }
const customerHeaders = { authorization: ['Bearer', 'customer-token'].join(' ') }

test('admin orders list requires authentication and admin role and returns pagination', async () => {
  const unauthenticated = await fetch(`${baseUrl}/api/admin/orders`)
  assert.equal(unauthenticated.status, 401)

  const customer = await fetch(`${baseUrl}/api/admin/orders`, { headers: customerHeaders })
  assert.equal(customer.status, 403)

  const admin = await fetch(`${baseUrl}/api/admin/orders?page=1&pageSize=20&paymentStatus=pending`, { headers: adminHeaders })
  assert.equal(admin.status, 200)
  assert.deepEqual(await admin.json(), {
    orders: [guestOrder, registeredOrder].map(({ items: _items, ...summary }) => summary),
    page: 1,
    pageSize: 20,
    total: 2,
  })
})

test('admin order list validates and applies the payment date-period cutoff', async () => {
  const createdAfter = '2026-10-01T00:00:00.000Z'
  const response = await fetch(`${baseUrl}/api/admin/orders?paymentStatus=paid&createdAfter=${encodeURIComponent(createdAfter)}`, {
    headers: adminHeaders,
  })
  assert.equal(response.status, 200)
  assert.deepEqual(lastOrderFilters, {
    paymentStatus: 'paid',
    createdAfter,
    page: 1,
    pageSize: 20,
  })

  const invalidDate = await fetch(`${baseUrl}/api/admin/orders?createdAfter=not-a-date`, { headers: adminHeaders })
  assert.equal(invalidDate.status, 400)
})

test('admin order list applies server-side payment search and status filters', async () => {
  const response = await fetch(`${baseUrl}/api/admin/orders?search=guest%40example.com&paymentStatus=failed`, {
    headers: adminHeaders,
  })
  assert.equal(response.status, 200)
  assert.deepEqual(lastOrderFilters, {
    search: 'guest@example.com',
    paymentStatus: 'failed',
    page: 1,
    pageSize: 20,
  })
})

test('admin can retrieve guest and registered orders with customer snapshots and item values', async () => {
  const guest = await fetch(`${baseUrl}/api/admin/orders/${guestOrder.id}`, { headers: adminHeaders })
  assert.equal(guest.status, 200)
  const guestBody = await guest.json() as { order: typeof guestOrder }
  assert.equal(guestBody.order.customerType, 'guest')
  assert.deepEqual(guestBody.order.items[0], {
    name: 'Snapshot Laptop',
    unitPrice: 250000,
    quantity: 1,
    subtotal: 250000,
  })

  const registered = await fetch(`${baseUrl}/api/admin/orders/${registeredOrder.id}`, { headers: adminHeaders })
  assert.equal(registered.status, 200)
  assert.equal((await registered.json() as { order: typeof registeredOrder }).order.customerType, 'registered')
})

test('admin fulfillment status accepts supported values without changing payment status', async () => {
  const response = await fetch(`${baseUrl}/api/admin/orders/${guestOrder.id}/status`, {
    method: 'PATCH',
    headers: { ...adminHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'shipped' }),
  })
  assert.equal(response.status, 200)
  const body = await response.json() as { order: typeof guestOrder }
  assert.equal(body.order.status, 'shipped')
  assert.equal(body.order.paymentStatus, 'pending')
})

test('invalid fulfillment status and malformed body are rejected', async () => {
  for (const body of [{ status: 'paid' }, { status: '' }, {}, { status: 'shipped', payment_status: 'paid' }]) {
    const response = await fetch(`${baseUrl}/api/admin/orders/${guestOrder.id}/status`, {
      method: 'PATCH',
      headers: { ...adminHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    assert.equal(response.status, 400)
  }
})

test('customer cannot update fulfillment status even with a client-supplied admin role', async () => {
  const response = await fetch(`${baseUrl}/api/admin/orders/${guestOrder.id}/status`, {
    method: 'PATCH',
    headers: {
      ...customerHeaders,
      'content-type': 'application/json',
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ status: 'delivered', role: 'admin' }),
  })
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { error: 'Administrator access required' })
})

test('admin order detail returns 404 when the order does not exist', async () => {
  const response = await fetch(`${baseUrl}/api/admin/orders/33333333-3333-3333-3333-333333333333`, {
    headers: adminHeaders,
  })
  assert.equal(response.status, 404)
})
