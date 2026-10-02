import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'
import type { CheckoutInput, PaymentResult } from '../types/payment.types.js'
import { paystackGateway, type PaystackGateway } from './paystack.service.js'

export class PaymentServiceError extends Error {
  constructor(message: string, readonly statusCode = 500) {
    super(message)
    this.name = 'PaymentServiceError'
  }
}

type DatabaseResult<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

type ProductForCheckout = {
  id: string
  name: string
  price: string | number
  stock_quantity: number
  is_active: boolean
}

type OrderRecord = {
  id: string
  order_number: string
  payment_reference: string
  total_amount: string | number
  payment_status: string
  payment_transaction_id: number | null
}

type PaymentDatabase = Pick<SupabaseClient, 'from'>

export type PaymentService = ReturnType<typeof createPaymentService>

export function toKobo(value: string | number) {
  const naira = Number(value)
  if (!Number.isFinite(naira) || naira < 0) {
    throw new PaymentServiceError('A product has an invalid price', 500)
  }
  const kobo = Math.round(naira * 100)
  if (!Number.isSafeInteger(kobo)) {
    throw new PaymentServiceError('The order amount is too large', 400)
  }
  return kobo
}

function makeOrderNumber() {
  return `MJD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`
}

const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAYMENT_REFERENCE_PATTERN = /^majidadi-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateCustomer(input: CheckoutInput) {
  if (!input.customer_name.trim() || input.customer_name.length > 150) {
    throw new PaymentServiceError('Enter a valid full name', 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customer_email) || input.customer_email.length > 254) {
    throw new PaymentServiceError('Enter a valid email address', 400)
  }
  const phoneDigits = input.customer_phone.replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new PaymentServiceError('Enter a valid phone number', 400)
  }
  if (input.delivery_method === 'delivery') {
    if (!input.delivery_address?.trim() || !input.delivery_city?.trim() || !input.delivery_state?.trim()) {
      throw new PaymentServiceError('Delivery address, city, and state are required', 400)
    }
  }
}

export function createPaymentService(
  database: PaymentDatabase = supabaseServer,
  gateway: PaystackGateway = paystackGateway,
) {
  return {
    async initialize(input: CheckoutInput) {
      validateCustomer(input)
      if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) {
        throw new PaymentServiceError('The cart must contain between 1 and 50 products', 400)
      }

      const productQuantities = new Map<string, number>()
      for (const item of input.items) {
        if (!item || !PRODUCT_ID_PATTERN.test(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
          throw new PaymentServiceError('Cart items must include a valid product id and quantity from 1 to 100', 400)
        }
        if (productQuantities.has(item.product_id)) {
          throw new PaymentServiceError('Each product must appear only once in the cart', 400)
        }
        productQuantities.set(item.product_id, item.quantity)
      }

      const productIds = [...productQuantities.keys()]
      const productResult = await (database
        .from('products')
        .select('id, name, price, stock_quantity, is_active')
        .in('id', productIds) as unknown as Promise<DatabaseResult<ProductForCheckout[]>>)
      if (productResult.error) throw new PaymentServiceError('Unable to validate cart products')
      const products = productResult.data ?? []
      if (products.length !== productIds.length) {
        throw new PaymentServiceError('One or more cart products are no longer available', 400)
      }

      const orderItems = products.map((product) => {
        const quantity = productQuantities.get(product.id)
        if (!product.is_active || quantity === undefined) {
          throw new PaymentServiceError('One or more cart products are no longer available', 400)
        }
        if (quantity > product.stock_quantity) {
          throw new PaymentServiceError(`${product.name} does not have enough stock`, 400)
        }
        const unitPriceKobo = toKobo(product.price)
        return {
          product_id: product.id,
          product_name: product.name,
          unit_price: unitPriceKobo / 100,
          quantity,
          subtotal: unitPriceKobo * quantity / 100,
        }
      })
      const totalKobo = orderItems.reduce((total, item) => total + toKobo(item.subtotal), 0)
      if (totalKobo <= 0) throw new PaymentServiceError('The order total must be greater than zero', 400)
      if (!Number.isSafeInteger(totalKobo)) throw new PaymentServiceError('The order amount is too large', 400)

      const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '')
      if (!frontendUrl) throw new PaymentServiceError('Payment callback URL is not configured')

      const reference = `majidadi-${randomUUID()}`
      const orderNumber = makeOrderNumber()
      const orderResult = await (database
        .from('orders')
        .insert({
          user_id: null,
          order_number: orderNumber,
          total_amount: totalKobo / 100,
          status: 'pending',
          payment_status: 'pending',
          payment_reference: reference,
          customer_name: input.customer_name.trim(),
          customer_email: input.customer_email.trim().toLowerCase(),
          customer_phone: input.customer_phone.trim(),
          delivery_address: input.delivery_method === 'delivery' ? input.delivery_address?.trim() : null,
          delivery_city: input.delivery_method === 'delivery' ? input.delivery_city?.trim() : null,
          delivery_state: input.delivery_method === 'delivery' ? input.delivery_state?.trim() : null,
          delivery_method: input.delivery_method,
        })
        .select('id, order_number, payment_reference, total_amount, payment_status, payment_transaction_id')
        .single() as unknown as Promise<DatabaseResult<OrderRecord>>)
      if (orderResult.error || !orderResult.data) {
        console.error('Order creation failed', orderResult.error)
        throw new PaymentServiceError('Unable to create the order')
      }

      const order = orderResult.data
      const itemResult = await (database
        .from('order_items')
        .insert(orderItems.map((item) => ({ ...item, order_id: order.id }))) as unknown as Promise<DatabaseResult<unknown>>)
      if (itemResult.error) {
        const cleanup = await (database.from('orders').delete().eq('id', order.id) as unknown as Promise<DatabaseResult<unknown>>)
        if (cleanup.error) console.error('Failed to clean up incomplete order', cleanup.error)
        console.error('Order item creation failed', itemResult.error)
        throw new PaymentServiceError('Unable to create the order')
      }

      try {
        const payment = await gateway.initialize({
          email: input.customer_email.trim().toLowerCase(),
          amount: totalKobo,
          reference,
          callback_url: `${frontendUrl}/payment/callback`,
          metadata: { order_number: order.order_number },
        })
        if (payment.reference !== reference) throw new PaymentServiceError('Payment reference mismatch')
        return {
          authorizationUrl: payment.authorization_url,
          reference,
          orderNumber: order.order_number,
        }
      } catch (error) {
        const update = await (database
          .from('orders')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('id', order.id) as unknown as Promise<DatabaseResult<unknown>>)
        if (update.error) console.error('Failed to update order after payment initialization error', update.error)
        if (error instanceof PaymentServiceError) throw error
        throw new PaymentServiceError('Unable to initialize payment')
      }
    },

    async verify(reference: string): Promise<PaymentResult> {
      if (!PAYMENT_REFERENCE_PATTERN.test(reference)) {
        throw new PaymentServiceError('Invalid payment reference', 400)
      }
      const orderResult = await (database
        .from('orders')
        .select('id, order_number, payment_reference, total_amount, payment_status, payment_transaction_id')
        .eq('payment_reference', reference)
        .maybeSingle() as unknown as Promise<DatabaseResult<OrderRecord>>)
      if (orderResult.error) throw new PaymentServiceError('Unable to find the order')
      const order = orderResult.data
      if (!order) throw new PaymentServiceError('Order not found', 404)

      const transaction = await gateway.verify(reference)
      if (transaction.reference !== reference || transaction.currency !== 'NGN') {
        throw new PaymentServiceError('Payment details do not match this order', 400)
      }
      if (transaction.status !== 'success') {
        return { verified: false, message: 'Payment was not completed. You can return to checkout and try again.' }
      }
      if (transaction.amount !== toKobo(order.total_amount)) {
        throw new PaymentServiceError('The verified payment amount does not match the order', 400)
      }
      if (order.payment_status === 'paid') {
        if (order.payment_transaction_id !== transaction.id) {
          throw new PaymentServiceError('Order has already been paid with a different transaction', 409)
        }
        return { verified: true, orderNumber: order.order_number, message: 'Payment verified' }
      }
      if (order.payment_status !== 'pending') {
        throw new PaymentServiceError('This order can no longer be paid', 409)
      }

      const update = await (database
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_transaction_id: transaction.id,
          status: 'processing',
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')
        .select('id, order_number, payment_reference, total_amount, payment_status, payment_transaction_id')
        .maybeSingle() as unknown as Promise<DatabaseResult<OrderRecord>>)
      if (update.error) throw new PaymentServiceError('Unable to update payment status')
      if (update.data) {
        return { verified: true, orderNumber: order.order_number, message: 'Payment verified' }
      }

      const latest = await (database
        .from('orders')
        .select('id, order_number, payment_reference, total_amount, payment_status, payment_transaction_id')
        .eq('id', order.id)
        .maybeSingle() as unknown as Promise<DatabaseResult<OrderRecord>>)
      if (latest.error) throw new PaymentServiceError('Unable to confirm payment status')
      if (latest.data?.payment_status === 'paid' && latest.data.payment_transaction_id === transaction.id) {
        return { verified: true, orderNumber: latest.data.order_number, message: 'Payment verified' }
      }
      throw new PaymentServiceError('Payment status could not be updated', 409)
    },
  }
}

export const paymentService = createPaymentService()
