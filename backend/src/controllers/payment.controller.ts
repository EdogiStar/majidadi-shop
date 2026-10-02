import type { Request, Response } from 'express'
import { PaymentServiceError, paymentService, type PaymentService } from '../services/payment.service.js'
import type { CheckoutInput } from '../types/payment.types.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAYMENT_REFERENCE_PATTERN = /^majidadi-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CHECKOUT_FIELDS = new Set([
  'customer_name',
  'customer_email',
  'customer_phone',
  'delivery_method',
  'delivery_address',
  'delivery_city',
  'delivery_state',
  'items',
])

function validateCheckoutBody(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object'
  const values = body as Record<string, unknown>
  if (Object.keys(values).some((key) => !CHECKOUT_FIELDS.has(key))) return 'Request contains unsupported checkout fields'
  if (typeof values.customer_name !== 'string' || !values.customer_name.trim()) return 'Full name is required'
  if (typeof values.customer_email !== 'string' || !values.customer_email.trim()) return 'Email address is required'
  if (typeof values.customer_phone !== 'string' || !values.customer_phone.trim()) return 'Phone number is required'
  if (values.delivery_method !== 'delivery' && values.delivery_method !== 'pickup') return 'Choose a valid delivery method'
  if (
    values.delivery_method === 'delivery'
    && (
      typeof values.delivery_address !== 'string'
      || !values.delivery_address.trim()
      || typeof values.delivery_city !== 'string'
      || !values.delivery_city.trim()
      || typeof values.delivery_state !== 'string'
      || !values.delivery_state.trim()
    )
  ) return 'Delivery address, city, and state are required'
  if (
    !Array.isArray(values.items)
    || values.items.length === 0
    || values.items.some((item) =>
      !item
      || typeof item !== 'object'
      || Array.isArray(item)
      || Object.keys(item).some((key) => key !== 'product_id' && key !== 'quantity')
      || typeof item.product_id !== 'string'
      || !UUID_PATTERN.test(item.product_id)
      || !Number.isInteger(item.quantity)
    )
  ) return 'Cart items must include valid product ids and integer quantities'
  return null
}

export function createPaymentController(service: PaymentService = paymentService) {
  return {
    initialize: async (request: Request, response: Response) => {
      const validationError = validateCheckoutBody(request.body)
      if (validationError) {
        response.status(400).json({ error: validationError })
        return
      }
      try {
        const payment = await service.initialize(request.body as CheckoutInput, request.user?.id)
        response.status(201).json(payment)
      } catch (error) {
        handlePaymentError(error, response, 'Unable to initialize payment')
      }
    },
    verify: async (request: Request, response: Response) => {
      const reference = request.body && typeof request.body === 'object'
        ? (request.body as Record<string, unknown>).reference
        : undefined
      if (typeof reference !== 'string' || !PAYMENT_REFERENCE_PATTERN.test(reference)) {
        response.status(400).json({ error: 'A valid payment reference is required' })
        return
      }
      try {
        response.json(await service.verify(reference))
      } catch (error) {
        handlePaymentError(error, response, 'Unable to verify payment')
      }
    },
  }
}

function handlePaymentError(error: unknown, response: Response, fallback: string) {
  if (error instanceof PaymentServiceError) {
    if (error.statusCode >= 500) console.error(error)
    response.status(error.statusCode).json({ error: error.message })
    return
  }
  if (error instanceof Error) console.error(error)
  response.status(500).json({ error: fallback })
}
