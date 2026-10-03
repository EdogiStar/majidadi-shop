import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createAdminCustomersService } = require('../src/services/adminCustomers.service.ts') as typeof import('../src/services/adminCustomers.service.js')

test('directory RPC returns profile fields and email with filtered pagination arguments', async () => {
  let rpcName = ''
  let rpcArguments: Record<string, unknown> = {}
  const database = {
    rpc(name: string, args: Record<string, unknown>) {
      rpcName = name
      rpcArguments = args
      return Promise.resolve({
        data: {
          customers: [{
            id: '11111111-1111-1111-1111-111111111111',
            full_name: 'Customer',
            email: 'customer@example.com',
            phone: '+2348000000000',
            role: 'customer',
            created_at: '2026-10-01T12:00:00.000Z',
            updated_at: '2026-10-01T12:00:00.000Z',
          }],
          total: 1,
        },
        error: null,
      })
    },
  }
  const service = createAdminCustomersService(
    database as unknown as Parameters<typeof createAdminCustomersService>[0],
    {} as Parameters<typeof createAdminCustomersService>[1],
  )
  const result = await service.list({
    search: 'customer@example.com',
    role: 'customer',
    page: 2,
    pageSize: 10,
  })
  assert.equal(rpcName, 'admin_list_customers')
  assert.deepEqual(rpcArguments, {
    p_search: 'customer@example.com',
    p_role: 'customer',
    p_page: 2,
    p_page_size: 10,
  })
  assert.equal(result.total, 1)
  assert.equal(result.customers[0]?.email, 'customer@example.com')
})

test('customer details use the profile id for Auth email and registered-only order history', async () => {
  const registeredId = '11111111-1111-1111-1111-111111111111'
  let profileId = ''
  let authUserId = ''
  let requestedOrdersUserId = ''
  const database = {
    from(table: string) {
      assert.equal(table, 'profiles')
      const query = {
        select: () => query,
        eq(column: string, value: string) {
          assert.equal(column, 'id')
          profileId = value
          return query
        },
        maybeSingle: async () => ({
          data: {
            id: registeredId,
            full_name: 'Registered Customer',
            phone: '+2348000000000',
            role: 'customer',
            created_at: '2026-10-01T12:00:00.000Z',
            updated_at: '2026-10-01T12:00:00.000Z',
          },
          error: null,
        }),
      }
      return query
    },
    auth: {
      admin: {
        async getUserById(id: string) {
          authUserId = id
          return { data: { user: { id, email: 'registered@example.com' } }, error: null }
        },
      },
    },
  }
  const orders = {
    async list(userId: string) {
      requestedOrdersUserId = userId
      return [{ orderNumber: 'MJD-M4ABC-1234ABCD', status: 'delivered' }]
    },
  }
  const service = createAdminCustomersService(
    database as unknown as Parameters<typeof createAdminCustomersService>[0],
    orders as unknown as Parameters<typeof createAdminCustomersService>[1],
  )
  const result = await service.find(registeredId)

  assert.equal(profileId, registeredId)
  assert.equal(authUserId, registeredId)
  assert.equal(requestedOrdersUserId, registeredId)
  assert.equal(result?.customer.email, 'registered@example.com')
  assert.deepEqual(result?.orders, [{ orderNumber: 'MJD-M4ABC-1234ABCD', status: 'delivered' }])
})
