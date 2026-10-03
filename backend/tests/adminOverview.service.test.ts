import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createAdminOverviewService } = require('../src/services/adminOverview.service.ts') as typeof import('../src/services/adminOverview.service.js')

test('overview is retrieved with one database-side aggregate RPC', async () => {
  let calledFunction = ''
  const metrics = {
    totalRevenue: 1250,
    paidOrderCount: 2,
    orders: { total: 5, pending: 1, processing: 1, shipped: 1, delivered: 1, cancelled: 1 },
    products: { total: 4, active: 3, inactive: 1, lowStock: 2 },
    registeredCustomers: 3,
    recentOrders: [{
      id: '11111111-1111-1111-1111-111111111111',
      orderNumber: 'MJD-M4ABC-1234ABCD',
      customerName: 'Guest',
      customerType: 'guest',
      totalAmount: 250,
      status: 'pending',
      paymentStatus: 'failed',
      createdAt: '2026-10-01T12:00:00.000Z',
    }],
  }
  const database = {
    rpc(name: string) {
      calledFunction = name
      return Promise.resolve({ data: metrics, error: null })
    },
  }
  const service = createAdminOverviewService(database as unknown as Parameters<typeof createAdminOverviewService>[0])
  assert.deepEqual(await service.get(), metrics)
  assert.equal(calledFunction, 'admin_get_overview_metrics')
})
