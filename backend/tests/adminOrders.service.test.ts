import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createAdminOrdersService } = require('../src/services/adminOrders.service.ts') as typeof import('../src/services/adminOrders.service.js')

test('admin detail reads historical order item snapshots without querying current products', async () => {
  const orderId = '11111111-1111-1111-1111-111111111111'
  const queriedTables: string[] = []
  const selections: string[] = []
  const orderRow = {
    id: orderId,
    order_number: 'MJD-M4ABC-1234ABCD',
    user_id: null,
    total_amount: '260000.00',
    status: 'pending',
    payment_status: 'pending',
    payment_reference: 'majidadi-11111111-1111-1111-1111-111111111111',
    customer_name: 'Guest Customer',
    customer_email: 'guest@example.com',
    customer_phone: '+2348000000000',
    delivery_method: 'delivery',
    delivery_address: '1 Test Road',
    delivery_city: 'Abuja',
    delivery_state: 'FCT',
    created_at: '2026-10-01T12:00:00.000Z',
    updated_at: '2026-10-01T12:00:00.000Z',
  }
  const historicalItems = [{
    product_name: 'Name at time of purchase',
    unit_price: '250000.00',
    quantity: 1,
    subtotal: '250000.00',
  }]
  const database = {
    from(table: string) {
      queriedTables.push(table)
      const queryInfo = { select: '' }
      const query = {
        select(columns: string) {
          queryInfo.select = columns
          selections.push(columns)
          return query
        },
        eq(column: string, value: string) {
          if (table === 'orders' && column === 'id' && value === orderId) return query
          if (table === 'order_items' && column === 'order_id' && value === orderId) {
            return Promise.resolve({ data: historicalItems, error: null })
          }
          return query
        },
        maybeSingle() {
          return Promise.resolve({ data: orderRow, error: null })
        },
      }
      return query
    },
  }

  const service = createAdminOrdersService(database as unknown as Parameters<typeof createAdminOrdersService>[0])
  const order = await service.find(orderId)

  assert.deepEqual(queriedTables, ['orders', 'order_items'])
  assert.equal(selections[1], 'product_name, unit_price, quantity, subtotal')
  assert.deepEqual(order?.items, [{
    name: 'Name at time of purchase',
    unitPrice: 250000,
    quantity: 1,
    subtotal: 250000,
  }])
  assert.equal(order?.customerType, 'guest')
  assert.equal(order?.totalAmount, 260000)
})
