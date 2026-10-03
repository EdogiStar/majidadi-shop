import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { CartServiceError, createCartService } = require('../src/services/cart.service.ts') as typeof import('../src/services/cart.service.js')

test('adding a cart item calls the atomic database operation with authenticated identity', async () => {
  const rpcCalls: unknown[][] = []
  const database = {
    rpc: async (...args: unknown[]) => {
      rpcCalls.push(args)
      return { error: null }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: 'cart-one', cart_items: [] },
            error: null,
          }),
        }),
      }),
    }),
  }
  const service = createCartService(database as unknown as Parameters<typeof createCartService>[0])

  const items = await service.add('verified-user-id', 'verified-product-id', 3)

  assert.deepEqual(rpcCalls, [[
    'add_cart_item',
    { p_user_id: 'verified-user-id', p_product_id: 'verified-product-id', p_quantity: 3 },
  ]])
  assert.deepEqual(items, [])
})

test('database stock errors become a conflict response', async () => {
  const database = {
    rpc: async () => ({ error: { code: 'P0001', message: 'Insufficient product stock' } }),
  }
  const service = createCartService(database as unknown as Parameters<typeof createCartService>[0])

  await assert.rejects(
    service.add('verified-user-id', 'verified-product-id', 3),
    (error: unknown) => error instanceof CartServiceError && error.statusCode === 409,
  )
})

test('missing cart records are returned as an empty cart', async () => {
  const database = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }
  const service = createCartService(database as unknown as Parameters<typeof createCartService>[0])

  assert.deepEqual(await service.get('verified-user-id'), [])
})
