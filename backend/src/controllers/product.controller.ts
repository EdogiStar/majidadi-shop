import type { Request, Response } from 'express'
import { ProductServiceError, productService, type ProductService } from '../services/product.service.js'
import type { ProductInput, ProductUpdate } from '../types/product.types.js'

const MAX_FILTER_LENGTH = 100
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRODUCT_FIELDS = new Set(['name', 'slug', 'description', 'price', 'stock_quantity', 'category_id', 'image_url', 'is_active'])
const REQUIRED_CREATE_FIELDS = ['name', 'slug', 'price'] as const

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
    create: async (request: Request, response: Response) => {
      const validationError = validateProductBody(request.body, true)
      if (validationError) {
        response.status(400).json({ error: validationError })
        return
      }

      try {
        const product = await service.create(request.body as ProductInput)
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
        const product = await service.update(id, request.body as ProductUpdate)
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
    return 'name, slug, and price are required'
  }
  if (!creating && keys.length === 0) return 'At least one product field is required'

  for (const field of ['name', 'slug'] as const) {
    if (field in values && (typeof values[field] !== 'string' || !values[field].trim())) {
      return `${field} must be a nonblank string`
    }
  }
  if ('price' in values && (typeof values.price !== 'number' || !Number.isFinite(values.price) || values.price < 0)) {
    return 'price must be a number greater than or equal to 0'
  }
  if ('stock_quantity' in values && (!Number.isInteger(values.stock_quantity) || (values.stock_quantity as number) < 0)) {
    return 'stock_quantity must be a nonnegative integer'
  }
  if ('category_id' in values && values.category_id !== null && (typeof values.category_id !== 'string' || !UUID_PATTERN.test(values.category_id))) {
    return 'category_id must be a valid UUID or null'
  }
  for (const field of ['description', 'image_url'] as const) {
    if (field in values && values[field] !== null && typeof values[field] !== 'string') {
      return `${field} must be a string or null`
    }
  }
  if ('is_active' in values && typeof values.is_active !== 'boolean') return 'is_active must be a boolean'
  return null
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
