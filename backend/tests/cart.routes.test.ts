import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { User } from '@supabase/supabase-js'
import type { CartService } from '../src/services/cart.service.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')
const productId = '11111111-1111-1111-1111-111111111111'
const carts = new Map<string, { productId: string; quantity: number }[]>()
let calls: string[] = []

const cartServiceMock = {
  get: async (userId: string) => {
    calls.push(`get:${userId}`)
    return (carts.get(userId) ?? []).map((item) => ({ ...item }))
  },
  add: async (userId: string, id: string, quantity: number) => {
    calls.push(`add:${userId}`)
    const items = carts.get(userId) ?? []
    const existing = items.find((item) => item.productId === id)
    if (existing) existing.quantity += quantity
    else items.push({ productId: id, quantity })
    carts.set(userId, items)
    return items.map((item) => ({ ...item }))
  },
  update: async (userId: string, id: string, quantity: number) => {
    calls.push(`update:${userId}`)
    const items = carts.get(userId) ?? []
    const item = items.find((entry) => entry.productId === id)
    if (!item) return null
    item.quantity = quantity
    return items.map((entry) => ({ ...entry }))
  },
  remove: async (userId: string, id: string) => {
    calls.push(`remove:${userId}`)
    const items = (carts.get(userId) ?? []).filter((item) => item.productId !== id)
    carts.set(userId, items)
    return items.map((item) => ({ ...item }))
  },
  clear: async (userId: string) => {
    calls.push(`clear:${userId}`)
    carts.set(userId, [])
    return []
  },
} as unknown as CartService

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  const app = createApp(undefined, {
    verifyAccessToken: async (token) => {
      if (token === 'user-one-token') return { id: 'user-one' } as User
      if (token === 'user-two-token') return { id: 'user-two' } as User
      return null
    },
  }, undefined, undefined, undefined, undefined, undefined, undefined, cartServiceMock)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/cart`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

function auth(token: string) {
  return { authorization: `Bearer ${token}` }
}

test('cart API requires a valid authenticated session', async () => {
  assert.equal((await fetch(baseUrl)).status, 401)
  assert.equal((await fetch(baseUrl, { headers: auth('invalid-token') })).status, 401)
})

test('authenticated user gets an empty cart and cannot see another user cart', async () => {
  carts.set('user-one', [{ productId, quantity: 2 }])
  const response = await fetch(baseUrl, { headers: auth('user-two-token') })
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).items, [])
  assert.equal(calls.at(-1), 'get:user-two')
})

test('authenticated user can add and update cart items using verified identity', async () => {
  const added = await fetch(`${baseUrl}/items`, {
    method: 'POST',
    headers: { ...auth('user-one-token'), 'content-type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity: 2, user_id: 'user-two' }),
  })
  assert.equal(added.status, 400)

  const response = await fetch(`${baseUrl}/items`, {
    method: 'POST',
    headers: { ...auth('user-one-token'), 'content-type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity: 2 }),
  })
  assert.equal(response.status, 201)
  assert.equal(calls.at(-1), 'add:user-one')

  const updated = await fetch(`${baseUrl}/items/${productId}`, {
    method: 'PATCH',
    headers: { ...auth('user-one-token'), 'content-type': 'application/json' },
    body: JSON.stringify({ quantity: 4 }),
  })
  assert.equal(updated.status, 200)
  assert.equal(calls.at(-1), 'update:user-one')
})

test('cart API validates product ids and quantity bounds', async () => {
  const invalidId = await fetch(`${baseUrl}/items`, {
    method: 'POST',
    headers: { ...auth('user-one-token'), 'content-type': 'application/json' },
    body: JSON.stringify({ product_id: 'not-a-uuid', quantity: 1 }),
  })
  assert.equal(invalidId.status, 400)

  const invalidQuantity = await fetch(`${baseUrl}/items`, {
    method: 'POST',
    headers: { ...auth('user-one-token'), 'content-type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity: 101 }),
  })
  assert.equal(invalidQuantity.status, 400)
})

test('authenticated user can remove an item and clear only their cart', async () => {
  carts.set('user-two', [])
  const removed = await fetch(`${baseUrl}/items/${productId}`, {
    method: 'DELETE',
    headers: auth('user-one-token'),
  })
  assert.equal(removed.status, 200)
  assert.equal(calls.at(-1), 'remove:user-one')

  const cleared = await fetch(baseUrl, {
    method: 'DELETE',
    headers: auth('user-one-token'),
  })
  assert.equal(cleared.status, 200)
  assert.deepEqual((await cleared.json()).items, [])
  assert.equal(calls.at(-1), 'clear:user-one')
  assert.deepEqual(carts.get('user-two'), [])
})
