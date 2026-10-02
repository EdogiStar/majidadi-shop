import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { OrderTrackingService, TrackedOrder } from '../src/services/orderTracking.service.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')
const order: TrackedOrder = {
  orderNumber: 'MJD-M4ABC-1234ABCD',
  status: 'processing',
  paymentStatus: 'paid',
  totalAmount: 260000,
  currency: 'NGN',
  customerName: 'Test Customer',
  fulfillment: {
    method: 'delivery',
    address: '1 Test Road',
    city: 'Abuja',
    state: 'FCT',
  },
  createdAt: '2026-10-01T12:00:00.000Z',
  items: [
    { name: 'HP EliteBook 840 G8', quantity: 1, unitPrice: 250000, total: 250000 },
    { name: 'A4 Notebook', quantity: 2, unitPrice: 5000, total: 10000 },
  ],
}

const fakeOrderTrackingService: OrderTrackingService = {
  find: async (orderNumber, email) =>
    orderNumber === 'MJD-M4ABC-1234ABCD' && email === 'customer@example.com' ? order : null,
}

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  const app = createApp(undefined, {}, undefined, fakeOrderTrackingService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('valid order number and matching normalized email return the order items and persisted statuses', async () => {
  const response = await fetch(`${baseUrl}/api/orders/track?orderNumber=mjd-m4abc-1234abcd&email=%20CUSTOMER%40EXAMPLE.COM%20`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { order })
})

test('correct order number with wrong email returns generic not found', async () => {
  const response = await fetch(`${baseUrl}/api/orders/track?orderNumber=MJD-M4ABC-1234ABCD&email=wrong%40example.com`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    error: 'Order not found. Check the order number and email address and try again.',
  })
})

test('correct email with wrong order number returns the same generic not found', async () => {
  const response = await fetch(`${baseUrl}/api/orders/track?orderNumber=MJD-M4ABC-1234ABCE&email=customer%40example.com`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    error: 'Order not found. Check the order number and email address and try again.',
  })
})

test('invalid email and order number are rejected', async () => {
  const badEmail = await fetch(`${baseUrl}/api/orders/track?orderNumber=MJD-M4ABC-1234ABCD&email=invalid`)
  assert.equal(badEmail.status, 400)
  assert.deepEqual(await badEmail.json(), { error: 'Enter a valid email address' })

  const badOrderNumber = await fetch(`${baseUrl}/api/orders/track?orderNumber=12345&email=customer%40example.com`)
  assert.equal(badOrderNumber.status, 400)
  assert.deepEqual(await badOrderNumber.json(), { error: 'Enter a valid order number' })
})

test('tracking response does not expose internal ids or payment references', async () => {
  const response = await fetch(`${baseUrl}/api/orders/track?orderNumber=MJD-M4ABC-1234ABCD&email=customer%40example.com`)
  const body = await response.json() as { order: Record<string, unknown> }
  assert.equal('id' in body.order, false)
  assert.equal('payment_reference' in body.order, false)
  assert.equal('payment_transaction_id' in body.order, false)
  assert.equal('customer_email' in body.order, false)
  assert.equal(body.order.paymentStatus, 'paid')
})

test('pickup tracking response contains no delivery address', async () => {
  const pickupOrder = { ...order, fulfillment: { method: 'pickup' as const } }
  const service: OrderTrackingService = { find: async () => pickupOrder }
  const app = createApp(undefined, {}, undefined, service)
  const pickupServer = app.listen(0)
  await new Promise<void>((resolve) => pickupServer.once('listening', resolve))
  const pickupUrl = `http://127.0.0.1:${(pickupServer.address() as AddressInfo).port}`
  try {
    const response = await fetch(`${pickupUrl}/api/orders/track?orderNumber=MJD-M4ABC-1234ABCD&email=customer%40example.com`)
    const body = await response.json() as { order: TrackedOrder }
    assert.deepEqual(body.order.fulfillment, { method: 'pickup' })
  } finally {
    await new Promise<void>((resolve, reject) => pickupServer.close((error) => error ? reject(error) : resolve()))
  }
})
