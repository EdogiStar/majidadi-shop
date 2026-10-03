import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

const { createProductService } = require('../src/services/product.service.ts') as typeof import('../src/services/product.service.js')

function createFakeDatabase() {
  let selectedColumns = ''
  const filters: Array<[string, string | boolean]> = []
  const database = {
    from: () => ({
      select(columns: string) {
        selectedColumns = columns
        return this
      },
      eq(column: string, value: string | boolean) {
        filters.push([column, value])
        return this
      },
      order() {
        return this
      },
      then(resolve: (result: { data: never[]; error: null }) => unknown, reject: (reason: unknown) => unknown) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject)
      },
    }),
  }
  return {
    database,
    get selectedColumns() { return selectedColumns },
    filters,
  }
}

test('category filtering uses an inner category relation for each supported category slug', async () => {
  for (const category of ['phones', 'laptops', 'stationery', 'books', 'accessories', 'other']) {
    const fake = createFakeDatabase()
    const service = createProductService(fake.database as unknown as Parameters<typeof createProductService>[0])

    await service.list({ category })

    assert.match(fake.selectedColumns, /category:categories!inner\(/, `${category} must filter products through the category relation`)
    assert.ok(fake.filters.some(([column, value]) => column === 'category.slug' && value === category))
  }
})

test('listing all products keeps the optional category relation and does not filter by category', async () => {
  const fake = createFakeDatabase()
  const service = createProductService(fake.database as unknown as Parameters<typeof createProductService>[0])

  await service.list({})

  assert.match(fake.selectedColumns, /category:categories\(/)
  assert.doesNotMatch(fake.selectedColumns, /category:categories!inner\(/)
  assert.deepEqual(fake.filters, [['is_active', true]])
})
