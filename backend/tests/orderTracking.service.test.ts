import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createOrderTrackingService } = require('../src/services/orderTracking.service.ts') as typeof import('../src/services/orderTracking.service.js')

test('tracking looks up by both order number and email, then returns sanitized persisted order data', async () => {
  const orderId = 'internal-order-uuid'
  const queries: { table: string; select?: string; filters: [string, unknown][] }[] = []
  const orderRow = {
    id: orderId,
    order_number: 'MJD-M4ABC-1234ABCD',
    status: 'processing',
    payment_status: 'paid',
    total_amount: '260000.00',
    customer_name: 'Customer',
    delivery_method: 'delivery',
    delivery_address: '1 Test Road',
    delivery_city: 'Abuja',
    delivery_state: 'FCT',
    created_at: '2026-10-01T12:00:00.000Z',
  }
  const itemRows = [{
    product_name: 'Notebook',
    quantity: 2,
    unit_price: '5000.00',
    subtotal: '10000.00',
  }]
  const database = {
    from(table: string) {
      const queryInfo: { table: string; select?: string; filters: [string, unknown][] } = { table, filters: [] }
      queries.push(queryInfo)
      const query = {
        select(columns: string) {
          queryInfo.select = columns
          return query
        },
        eq(column: string, value: unknown) {
          queryInfo.filters.push([column, value])
          if (table === 'order_items') {
            return Promise.resolve({ data: value === orderId ? itemRows : [], error: null })
          }
          return query
        },
        maybeSingle() {
          const matchingOrder = queryInfo.filters.some(([column, value]) => column === 'order_number' && value === orderRow.order_number)
            && queryInfo.filters.some(([column, value]) => column === 'customer_email' && value === 'customer@example.com')
          return Promise.resolve({ data: matchingOrder ? orderRow : null, error: null })
        },
      }
      return query
    },
  }

  const service = createOrderTrackingService(database as unknown as Parameters<typeof createOrderTrackingService>[0])
  const result = await service.find('MJD-M4ABC-1234ABCD', 'customer@example.com')
  assert.deepEqual(queries[0]?.filters, [
    ['order_number', 'MJD-M4ABC-1234ABCD'],
    ['customer_email', 'customer@example.com'],
  ])
  assert.deepEqual(queries[1]?.filters, [['order_id', orderId]])
  assert.deepEqual(result, {
    orderNumber: 'MJD-M4ABC-1234ABCD',
    status: 'processing',
    paymentStatus: 'paid',
    totalAmount: 260000,
    currency: 'NGN',
    customerName: 'Customer',
    fulfillment: { method: 'delivery', address: '1 Test Road', city: 'Abuja', state: 'FCT' },
    createdAt: '2026-10-01T12:00:00.000Z',
    items: [{ name: 'Notebook', quantity: 2, unitPrice: 5000, total: 10000 }],
  })
  assert.equal(JSON.stringify(result).includes(orderId), false)
  assert.equal(queries[0]?.select?.includes('payment_reference'), false)
})

test('tracking does not query items when the order/email combination does not match', async () => {
  const tables: string[] = []
  const database = {
    from(table: string) {
      tables.push(table)
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: null, error: null }),
      }
      return query
    },
  }
  const service = createOrderTrackingService(database as unknown as Parameters<typeof createOrderTrackingService>[0])
  const result = await service.find('MJD-M4ABC-1234ABCD', 'wrong@example.com')
  assert.equal(result, null)
  assert.deepEqual(tables, ['orders'])
})
