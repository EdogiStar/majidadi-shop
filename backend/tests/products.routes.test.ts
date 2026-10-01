import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { ProductService } from '../src/services/product.service.js'
import type { Product } from '../src/types/product.types.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

// The backend client validates its environment at module initialization.
// Set test-safe placeholders before loading the application module.
const { createApp } = require('../src/app.ts') as typeof import('../src/app.js')

const product: Product = {
  id: '11111111-1111-1111-1111-111111111111',
  category_id: null,
  name: 'Test Phone',
  slug: 'test-phone',
  description: 'Test product',
  price: '100.00',
  stock_quantity: 4,
  image_url: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  category: null,
}

const fakeProductService: ProductService = {
  list: async ({ category, search }) => category === 'phones' && search === 'phone' ? [product] : [],
  getById: async (id) => id === product.id ? product : null,
}

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  const app = createApp(fakeProductService)
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('GET /api/products returns filtered products', async () => {
  const response = await fetch(`${baseUrl}/api/products?category=phones&search=phone`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { products: [product] })
})

test('GET /api/products/:id returns an active product', async () => {
  const response = await fetch(`${baseUrl}/api/products/${product.id}`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { product })
})

test('GET /api/products/:id returns 404 for an unavailable product', async () => {
  const response = await fetch(`${baseUrl}/api/products/22222222-2222-2222-2222-222222222222`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Product not found' })
})

test('GET /api/products rejects oversized filters before querying', async () => {
  const response = await fetch(`${baseUrl}/api/products?search=${'a'.repeat(101)}`)
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'search must be 100 characters or fewer' })
})

test('GET /api/products/:id rejects malformed UUIDs', async () => {
  const response = await fetch(`${baseUrl}/api/products/not-a-uuid`)
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Product id must be a valid UUID' })
})
