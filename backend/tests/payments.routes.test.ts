import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { PaymentService } from '../src/services/payment.service.js'
import type { User } from '@supabase/supabase-js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')
const reference = 'majidadi-11111111-1111-1111-1111-111111111111'
const validCheckout = {
  customer_name: 'Test Customer',
  customer_email: 'customer@example.com',
  customer_phone: '+2348000000000',
  delivery_method: 'pickup' as const,
  items: [{ product_id: '22222222-2222-2222-2222-222222222222', quantity: 2 }],
}

let initializationInput: unknown
let initializedUserId: string | undefined
let verificationReference = ''
const fakePaymentService: PaymentService = {
  initialize: async (input, userId) => {
    initializationInput = input
    initializedUserId = userId
    return { authorizationUrl: 'https://checkout.paystack.com/test', reference, orderNumber: 'MJD-TEST-00000000' }
  },
  verify: async (receivedReference) => {
    verificationReference = receivedReference
    return { verified: true, orderNumber: 'MJD-TEST-00000000', message: 'Payment verified' }
  },
}

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  const app = createApp(undefined, {
    verifyAccessToken: async (token) => token === 'verified-customer-token'
      ? { id: 'verified-customer-id' } as User
      : null,
  }, fakePaymentService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('payment initialization rejects client-provided amounts', async () => {
  const response = await fetch(`${baseUrl}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...validCheckout, amount: 1, total: 1 }),
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Request contains unsupported checkout fields' })
  assert.equal(initializationInput, undefined)
})

test('payment initialization accepts cart and customer details without a client total', async () => {
  const response = await fetch(`${baseUrl}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validCheckout),
  })
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), {
    authorizationUrl: 'https://checkout.paystack.com/test',
    reference,
    orderNumber: 'MJD-TEST-00000000',
  })
  assert.deepEqual(initializationInput, validCheckout)
  assert.equal(initializedUserId, undefined)
})

test('payment initialization associates an order only with the verified token identity', async () => {
  const response = await fetch(`${baseUrl}/api/payments/initialize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer verified-customer-token',
    },
    body: JSON.stringify({ ...validCheckout, user_id: 'attacker-selected-id' }),
  })
  assert.equal(response.status, 400)
  assert.equal(initializedUserId, undefined)

  const authenticatedResponse = await fetch(`${baseUrl}/api/payments/initialize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer verified-customer-token',
    },
    body: JSON.stringify(validCheckout),
  })
  assert.equal(authenticatedResponse.status, 201)
  assert.equal(initializedUserId, 'verified-customer-id')

  const invalidTokenResponse = await fetch(`${baseUrl}/api/payments/initialize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer invalid-token',
    },
    body: JSON.stringify(validCheckout),
  })
  assert.equal(invalidTokenResponse.status, 401)
})

test('payment verification requires a valid reference and returns backend verification', async () => {
  const invalid = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reference: 'not-a-reference' }),
  })
  assert.equal(invalid.status, 400)

  const response = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reference }),
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    verified: true,
    orderNumber: 'MJD-TEST-00000000',
    message: 'Payment verified',
  })
  assert.equal(verificationReference, reference)
})
