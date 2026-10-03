import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { ProductServiceError, productService, type ProductService } from '../services/product.service.js'
import type { ProductInput, ProductUpdate } from '../types/product.types.js'

const MAX_FILTER_LENGTH = 100
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRODUCT_FIELDS = new Set(['name', 'slug', 'description', 'price', 'stock_quantity', 'category_id', 'image_url', 'is_active'])
const REQUIRED_CREATE_FIELDS = ['name', 'price', 'category_id'] as const
const ADMIN_SORT_FIELDS = new Set(['created_at', 'name', 'price', 'stock_quantity'])

function readFilter(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function validateFilter(value: string | undefined, label: string) {
  if (value && value.length > MAX_FILTER_LENGTH) {
    return `${label} must be ${MAX_FILTER_LENGTH} characters or fewer`
  }
  return null
}

export function createProductController(service: ProductService = productService) {
  return {
    list: async (request: Request, response: Response) => {
      const category = readFilter(request.query.category)
      const search = readFilter(request.query.search)
      const categoryError = validateFilter(category, 'category')
      const searchError = validateFilter(search, 'search')

      if (categoryError || searchError) {
        response.status(400).json({ error: categoryError ?? searchError })
        return
      }

      try {
        const products = await service.list({ category, search })
        response.json({ products })
      } catch (error) {
        handleProductError(error, response, 'Unable to retrieve products')
      }
    },
    get: async (request: Request, response: Response) => {
      const id = typeof request.params.id === 'string' ? request.params.id : undefined
      if (!id || !UUID_PATTERN.test(id)) {
        response.status(400).json({ error: 'Product id must be a valid UUID' })
        return
      }

      try {
        const product = await service.getById(id)
        if (!product) {
          response.status(404).json({ error: 'Product not found' })
          return
        }
        response.json({ product })
      } catch (error) {
        handleProductError(error, response, 'Unable to retrieve products')
      }
    },
    listAdmin: async (request: Request, response: Response) => {
      for (const key of ['search', 'categoryId', 'status', 'sortBy', 'sortDirection']) {
        if (request.query[key] !== undefined && typeof request.query[key] !== 'string') {
          response.status(400).json({ error: `${key} must be a string` })
          return
        }
      }
      const search = readFilter(request.query.search)
      const categoryId = readFilter(request.query.categoryId)
      const status = readFilter(request.query.status) ?? 'all'
      const sortBy = readFilter(request.query.sortBy) ?? 'created_at'
      const sortDirection = readFilter(request.query.sortDirection) ?? 'desc'
      const searchError = validateFilter(search, 'search')
      if (searchError) {
        response.status(400).json({ error: searchError })
        return
      }
      if (categoryId && !UUID_PATTERN.test(categoryId)) {
        response.status(400).json({ error: 'categoryId must be a valid UUID' })
        return
      }
      if (!['all', 'active', 'inactive'].includes(status)) {
        response.status(400).json({ error: 'status must be all, active, or inactive' })
        return
      }
      if (!ADMIN_SORT_FIELDS.has(sortBy)) {
        response.status(400).json({ error: 'sortBy is not supported' })
        return
      }
      if (sortDirection !== 'asc' && sortDirection !== 'desc') {
        response.status(400).json({ error: 'sortDirection must be asc or desc' })
        return
      }
      try {
        const products = await service.listAdmin({ search, categoryId, status: status as 'all' | 'active' | 'inactive', sortBy: sortBy as 'created_at' | 'name' | 'price' | 'stock_quantity', sortDirection })
        response.json({ products })
      } catch (error) {
        handleProductError(error, response, 'Unable to retrieve products')
      }
    },
    getAdmin: async (request: Request, response: Response) => {
      const id = readProductId(request, response)
      if (!id) return
      try {
        const product = await service.getAdminById(id)
        if (!product) {
          response.status(404).json({ error: 'Product not found' })
          return
        }
        response.json({ product })
      } catch (error) {
        handleProductError(error, response, 'Unable to retrieve product')
      }
    },
    listCategories: async (_request: Request, response: Response) => {
      try {
        response.json({ categories: await service.listCategories() })
      } catch (error) {
        handleProductError(error, response, 'Unable to retrieve categories')
      }
    },
    create: async (request: Request, response: Response) => {
      const validationError = validateProductBody(request.body, true)
      if (validationError) {
        response.status(400).json({ error: validationError })
        return
      }

      try {
        const values = request.body as ProductInput
        const product = await service.create({
          ...values,
          slug: values.slug?.trim() || createProductSlug(values.name),
          name: values.name.trim(),
          description: values.description?.trim() || null,
        })
        response.status(201).json({ product })
      } catch (error) {
        handleProductError(error, response, 'Unable to create product')
      }
    },
    update: async (request: Request, response: Response) => {
      const id = readProductId(request, response)
      if (!id) return
      const validationError = validateProductBody(request.body, false)
      if (validationError) {
        response.status(400).json({ error: validationError })
        return
      }

      try {
        const values = request.body as ProductUpdate
        const update: ProductUpdate = {
          ...values,
          ...(values.name === undefined ? {} : {
            name: values.name.trim(),
            slug: values.slug?.trim() || createProductSlug(values.name),
          }),
          ...(values.description === undefined ? {} : { description: values.description?.trim() || null }),
        }
        const product = await service.update(id, update)
        if (!product) {
          response.status(404).json({ error: 'Product not found' })
          return
        }
        response.json({ product })
      } catch (error) {
        handleProductError(error, response, 'Unable to update product')
      }
    },
    delete: async (request: Request, response: Response) => {
      const id = readProductId(request, response)
      if (!id) return
      try {
        const product = await service.deactivate(id)
        if (!product) {
          response.status(404).json({ error: 'Product not found' })
          return
        }
        response.json({ product })
      } catch (error) {
        handleProductError(error, response, 'Unable to deactivate product')
      }
    },
  }
}

function readProductId(request: Request, response: Response) {
  const id = typeof request.params.id === 'string' ? request.params.id : undefined
  if (!id || !UUID_PATTERN.test(id)) {
    response.status(400).json({ error: 'Product id must be a valid UUID' })
    return null
  }
  return id
}

function validateProductBody(body: unknown, creating: boolean): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object'
  const values = body as Record<string, unknown>
  const keys = Object.keys(values)
  if (keys.some((key) => !PRODUCT_FIELDS.has(key))) return 'Request contains unsupported product fields'
  if (creating && REQUIRED_CREATE_FIELDS.some((field) => !(field in values))) {
    return 'name, price, and category_id are required'
  }
  if (!creating && keys.length === 0) return 'At least one product field is required'

  for (const field of ['name', 'slug'] as const) {
    if (field in values && (typeof values[field] !== 'string' || !values[field].trim())) {
      return `${field} must be a nonblank string`
    }
  }
  if (creating && (typeof values.name !== 'string' || !values.name.trim())) return 'name must be a nonblank string'
  if ('description' in values && values.description !== null && typeof values.description !== 'string') {
    return 'description must be a string or null'
  }
  if ('price' in values && (typeof values.price !== 'number' || !Number.isFinite(values.price) || values.price < 0)) {
    return 'price must be a number greater than or equal to 0'
  }
  if (creating && !('price' in values)) return 'price is required'
  if (creating && (typeof values.category_id !== 'string' || !UUID_PATTERN.test(values.category_id))) {
    return 'category_id must be a valid UUID'
  }
  if ('stock_quantity' in values && (!Number.isInteger(values.stock_quantity) || (values.stock_quantity as number) < 0)) {
    return 'stock_quantity must be a nonnegative integer'
  }
  if ('category_id' in values && values.category_id !== null
    && (typeof values.category_id !== 'string' || !UUID_PATTERN.test(values.category_id))) {
    return 'category_id must be a valid UUID or null'
  }
  if ('image_url' in values && values.image_url !== null) {
    if (typeof values.image_url !== 'string') return 'image_url must be a URL or null'
    try {
      const imageUrl = new URL(values.image_url)
      if (!['http:', 'https:'].includes(imageUrl.protocol)) return 'image_url must be an HTTP or HTTPS URL'
    } catch {
      return 'image_url must be a valid URL'
    }
  }
  if ('is_active' in values && typeof values.is_active !== 'boolean') return 'is_active must be a boolean'
  return null
}

function createProductSlug(name: string) {
  const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || `product-${randomUUID()}`
}

function handleProductError(error: unknown, response: Response, fallback: string) {
  if (error instanceof ProductServiceError && error.code === '23505') {
    response.status(409).json({ error: 'A product with this slug already exists' })
    return
  }
  if (error instanceof ProductServiceError && error.code === '23503') {
    response.status(400).json({ error: 'category_id does not reference an existing category' })
    return
  }
  if (error instanceof Error) console.error(error)
  response.status(500).json({ error: fallback })
}
