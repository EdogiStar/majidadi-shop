import type { Request, Response } from 'express'
import { CartServiceError, cartService, type CartService } from '../services/cart.service.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readProductId(value: unknown) {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null
}

function validateQuantity(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const values = body as Record<string, unknown>
  if (Object.keys(values).some((key) => key !== 'quantity')) return null
  return Number.isInteger(values.quantity) && Number(values.quantity) >= 1 && Number(values.quantity) <= 100
    ? Number(values.quantity)
    : null
}

function handleCartError(error: unknown, response: Response) {
  if (error instanceof CartServiceError) {
    if (error.statusCode >= 500) console.error(error)
    response.status(error.statusCode).json({ error: error.message })
    return
  }
  if (error instanceof Error) console.error(error)
  response.status(500).json({ error: 'Unable to update the cart' })
}

export function createCartController(service: CartService = cartService) {
  return {
    get: async (request: Request, response: Response) => {
      try {
        response.json({ items: await service.get(request.user!.id) })
      } catch (error) {
        handleCartError(error, response)
      }
    },
    add: async (request: Request, response: Response) => {
      const body = request.body
      if (!body || typeof body !== 'object' || Array.isArray(body)
        || Object.keys(body).some((key) => !['product_id', 'quantity'].includes(key))) {
        response.status(400).json({ error: 'Provide a product_id and quantity' })
        return
      }
      const productId = readProductId(body.product_id)
      const quantity = validateQuantity({ quantity: body.quantity })
      if (!productId || quantity === null) {
        response.status(400).json({ error: 'Provide a valid product_id and a quantity from 1 to 100' })
        return
      }
      try {
        response.status(201).json({ items: await service.add(request.user!.id, productId, quantity) })
      } catch (error) {
        handleCartError(error, response)
      }
    },
    update: async (request: Request, response: Response) => {
      const productId = readProductId(request.params.productId)
      const quantity = validateQuantity(request.body)
      if (!productId || quantity === null) {
        response.status(400).json({ error: 'Provide a valid product id and a quantity from 1 to 100' })
        return
      }
      try {
        const items = await service.update(request.user!.id, productId, quantity)
        if (!items) {
          response.status(404).json({ error: 'Cart item not found' })
          return
        }
        response.json({ items })
      } catch (error) {
        handleCartError(error, response)
      }
    },
    remove: async (request: Request, response: Response) => {
      const productId = readProductId(request.params.productId)
      if (!productId) {
        response.status(400).json({ error: 'Product id must be a valid UUID' })
        return
      }
      try {
        response.json({ items: await service.remove(request.user!.id, productId) })
      } catch (error) {
        handleCartError(error, response)
      }
    },
    clear: async (request: Request, response: Response) => {
      try {
        response.json({ items: await service.clear(request.user!.id) })
      } catch (error) {
        handleCartError(error, response)
      }
    },
  }
}
