import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { ProductService } from '../src/services/product.service.js'
import type { Product } from '../src/types/product.types.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

// The backend client validates its environment at module initialization.
// Set test-safe placeholders before loading the application module.
const { ProductServiceError } = require('../src/services/product.service.ts') as typeof import('../src/services/product.service.js')
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
  isAdmin: async (userId) => userId === 'admin-user',
  create: async (input) => {
    if (input.slug === product.slug) throw new ProductServiceError('duplicate slug', '23505')
    return {
      ...product,
      ...input,
      id: product.id,
      price: String(input.price),
      stock_quantity: input.stock_quantity ?? product.stock_quantity,
      category_id: input.category_id ?? product.category_id,
    }
  },
  update: async (id, input) => id === product.id ? {
    ...product,
    ...input,
    price: input.price === undefined ? product.price : String(input.price),
    stock_quantity: input.stock_quantity ?? product.stock_quantity,
    category_id: input.category_id ?? product.category_id,
  } : null,
  deactivate: async (id) => id === product.id ? { ...product, is_active: false } : null,
}

let server: ReturnType<ReturnType<typeof createApp>['listen']>
let baseUrl = ''

before(async () => {
  process.env.FRONTEND_URL = 'https://store.example/'
  const adminApp = createApp(fakeProductService, {
    verifyAccessToken: async (token) => token === 'admin-token'
      ? { id: 'admin-user', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
      : token === 'customer-token'
        ? { id: 'customer-user', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
        : null,
  })
  server = adminApp.listen(0)
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

test('CORS normalizes a trailing slash from the configured frontend origin', async () => {
  const response = await fetch(`${baseUrl}/api/products`, {
    headers: { Origin: 'https://store.example' },
  })
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://store.example')
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

test('admin product routes require a valid bearer token and admin profile role', async () => {
  const missingToken = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'New product', slug: 'new-product', price: 20 }),
  })
  assert.equal(missingToken.status, 401)

  const invalidToken = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { authorization: 'Bearer invalid-token', 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'New product', slug: 'new-product', price: 20 }),
  })
  assert.equal(invalidToken.status, 401)

  const customerToken = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { authorization: 'Bearer customer-token', 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'New product', slug: 'new-product', price: 20 }),
  })
  assert.equal(customerToken.status, 403)
  assert.deepEqual(await customerToken.json(), { error: 'Administrator access required' })
})

test('admin can create products with supported fields', async () => {
  const response = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'New product',
      slug: 'new-product',
      description: 'Description',
      price: 20,
      stock_quantity: 2,
      category_id: product.id,
      image_url: 'https://example.com/image.jpg',
      is_active: true,
    }),
  })
  assert.equal(response.status, 201)
  assert.equal((await response.json() as { product: Product }).product.name, 'New product')
})

test('admin product create rejects missing and malformed values', async () => {
  const missingName = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({ name: ' ', slug: 'new-product', price: -1 }),
  })
  assert.equal(missingName.status, 400)
  assert.deepEqual(await missingName.json(), { error: 'name must be a nonblank string' })

  const invalidFields = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'New product', slug: 'new-product', price: 10, stock_quantity: -1 }),
  })
  assert.equal(invalidFields.status, 400)
  assert.deepEqual(await invalidFields.json(), { error: 'stock_quantity must be a nonnegative integer' })
})

test('admin create reports duplicate slugs as a conflict', async () => {
  const response = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Duplicate', slug: product.slug, price: 20 }),
  })
  assert.equal(response.status, 409)
  assert.deepEqual(await response.json(), { error: 'A product with this slug already exists' })
})

test('admin can update and deactivate products', async () => {
  const update = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
    method: 'PATCH',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({ price: 25, is_active: false }),
  })
  assert.equal(update.status, 200)
  assert.equal((await update.json() as { product: Product }).product.price, '25')

  const deactivate = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
    method: 'DELETE',
    headers: { authorization: 'Bearer admin-token' },
  })
  assert.equal(deactivate.status, 200)
  assert.equal((await deactivate.json() as { product: Product }).product.is_active, false)
})

test('admin update rejects invalid category UUID and returns 404 for missing products', async () => {
  const invalidCategory = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
    method: 'PATCH',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({ category_id: 'invalid' }),
  })
  assert.equal(invalidCategory.status, 400)
  assert.deepEqual(await invalidCategory.json(), { error: 'category_id must be a valid UUID or null' })

  const missingProduct = await fetch(`${baseUrl}/api/admin/products/22222222-2222-2222-2222-222222222222`, {
    method: 'DELETE',
    headers: { authorization: 'Bearer admin-token' },
  })
  assert.equal(missingProduct.status, 404)
})
