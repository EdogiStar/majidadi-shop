import type { Request, Response } from 'express'
import { productService, type ProductService } from '../services/product.service.js'

const MAX_FILTER_LENGTH = 100

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
        handleProductError(error, response)
      }
    },
    get: async (request: Request, response: Response) => {
      const id = typeof request.params.id === 'string' ? request.params.id : undefined
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
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
        handleProductError(error, response)
      }
    },
  }
}

function handleProductError(error: unknown, response: Response) {
  if (error instanceof Error && error.name === 'ProductServiceError') {
    console.error(error)
  } else {
    console.error(error)
  }
  response.status(500).json({ error: 'Unable to retrieve products' })
}
