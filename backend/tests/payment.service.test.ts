import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CheckoutInput } from '../src/types/payment.types.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'
process.env.FRONTEND_URL = 'https://shop.example'

const { createPaymentService } = require('../src/services/payment.service.ts') as typeof import('../src/services/payment.service.js')

const productId = '22222222-2222-2222-2222-222222222222'
const reference = 'majidadi-11111111-1111-1111-1111-111111111111'
const checkout: CheckoutInput = {
  customer_name: 'Test Customer',
  customer_email: 'customer@example.com',
  customer_phone: '+2348000000000',
  delivery_method: 'pickup',
  items: [{ product_id: productId, quantity: 2 }],
}

function createFakeDatabase() {
  const state: {
    products: { id: string; name: string; price: string; stock_quantity: number; is_active: boolean }[]
    order: Record<string, unknown> | null
    orderItems: Record<string, unknown>[]
    orderUpdates: number
  } = {
    products: [{ id: productId, name: 'Test Phone', price: '123.45', stock_quantity: 5, is_active: true }],
    order: null,
    orderItems: [],
    orderUpdates: 0,
  }

  const database = {
    from(table: string) {
      let operation = ''
      let insertValues: unknown
      let updateValues: Record<string, unknown> = {}
      const filters = new Map<string, unknown>()
      const query = {
        select: (_columns: string) => query,
        in: async (_column: string, ids: string[]) => ({
          data: state.products.filter((product) => ids.includes(product.id)),
          error: null,
        }),
        insert: (values: unknown) => {
          operation = 'insert'
          insertValues = values
          if (table === 'order_items') {
            state.orderItems = values as Record<string, unknown>[]
            return Promise.resolve({ data: null, error: null })
          }
          return query
        },
        update: (values: Record<string, unknown>) => {
          operation = 'update'
          updateValues = values
          return query
        },
        eq: (column: string, value: unknown) => {
          filters.set(column, value)
          return query
        },
        single: async () => {
          if (table === 'orders' && operation === 'insert') {
            const input = insertValues as Record<string, unknown>
            state.order = {
              ...input,
              id: '33333333-3333-3333-3333-333333333333',
              payment_transaction_id: null,
            }
          }
          return { data: state.order, error: null }
        },
        maybeSingle: async () => {
          if (table === 'orders' && operation === 'update') {
            state.orderUpdates += 1
            if (state.order && filters.get('payment_status') === state.order.payment_status) {
              state.order = { ...state.order, ...updateValues }
            } else {
              return { data: null, error: null }
            }
          }
          return { data: state.order, error: null }
        },
      }
      return query
    },
  }

  return { database, state }
}

test('payment initialization charges database product prices and stores order item snapshots', async () => {
  const { database, state } = createFakeDatabase()
  let gatewayAmount = 0
  const service = createPaymentService(database as unknown as Parameters<typeof createPaymentService>[0], {
    initialize: async (input) => {
      gatewayAmount = input.amount
      return { authorization_url: 'https://checkout.paystack.com/access', reference: input.reference }
    },
    verify: async () => ({ status: 'success', reference, amount: 24690, currency: 'NGN', id: 42 }),
  })

  const result = await service.initialize(checkout)
  assert.equal(gatewayAmount, 24690)
  assert.equal(state.order?.total_amount, 246.9)
  assert.equal(state.order?.user_id, null)
  assert.equal(state.orderItems[0]?.unit_price, 123.45)
  assert.equal(state.orderItems[0]?.quantity, 2)
  assert.equal(state.orderItems[0]?.subtotal, 246.9)
  assert.equal(result.authorizationUrl, 'https://checkout.paystack.com/access')
  assert.match(result.reference, /^majidadi-[0-9a-f-]{36}$/i)
})

test('authenticated payment initialization persists only the supplied verified user identity', async () => {
  const { database, state } = createFakeDatabase()
  const service = createPaymentService(database as unknown as Parameters<typeof createPaymentService>[0], {
    initialize: async (input) => ({ authorization_url: 'https://checkout.paystack.com/access', reference: input.reference }),
    verify: async () => ({ status: 'success', reference, amount: 24690, currency: 'NGN', id: 42 }),
  })

  await service.initialize(checkout, 'verified-customer-id')
  assert.equal(state.order?.user_id, 'verified-customer-id')
})

test('verified payments update orders once and repeated verification is idempotent', async () => {
  const { database, state } = createFakeDatabase()
  state.order = {
    id: '33333333-3333-3333-3333-333333333333',
    order_number: 'MJD-TEST-00000000',
    payment_reference: reference,
    total_amount: '246.90',
    payment_status: 'pending',
    payment_transaction_id: null,
  }
  const service = createPaymentService(database as unknown as Parameters<typeof createPaymentService>[0], {
    initialize: async () => ({ authorization_url: 'https://checkout.paystack.com/access', reference }),
    verify: async () => ({ status: 'success', reference, amount: 24690, currency: 'NGN', id: 42 }),
  })

  const first = await service.verify(reference)
  const second = await service.verify(reference)
  assert.equal(first.verified, true)
  assert.equal(second.verified, true)
  assert.equal(state.order?.payment_status, 'paid')
  assert.equal(state.order?.payment_transaction_id, 42)
  assert.equal(state.orderUpdates, 1)
})
