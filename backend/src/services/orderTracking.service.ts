import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

export type TrackedOrderItem = {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export type TrackedOrder = {
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  currency: 'NGN'
  customerName: string
  fulfillment: {
    method: 'delivery' | 'pickup'
    address?: string
    city?: string
    state?: string
  }
  createdAt: string
  items: TrackedOrderItem[]
}

export class OrderTrackingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderTrackingError'
  }
}

type TrackingOrderRow = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: string | number
  customer_name: string
  delivery_method: 'delivery' | 'pickup'
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  created_at: string
}

type TrackingItemRow = {
  product_name: string
  quantity: number
  unit_price: string | number
  subtotal: string | number
}

type QueryResult<T> = {
  data: T | null
  error: { message: string } | null
}

type TrackingDatabase = Pick<SupabaseClient, 'from'>

export type OrderTrackingService = ReturnType<typeof createOrderTrackingService>

export function createOrderTrackingService(database: TrackingDatabase = supabaseServer) {
  return {
    async find(orderNumber: string, email: string): Promise<TrackedOrder | null> {
      const orderResult = await (database
        .from('orders')
        .select('id, order_number, status, payment_status, total_amount, customer_name, delivery_method, delivery_address, delivery_city, delivery_state, created_at')
        .eq('order_number', orderNumber)
        .eq('customer_email', email)
        .maybeSingle() as unknown as Promise<QueryResult<TrackingOrderRow>>)

      if (orderResult.error) throw new OrderTrackingError(orderResult.error.message)
      const order = orderResult.data
      if (!order) return null

      const itemResult = await (database
        .from('order_items')
        .select('product_name, quantity, unit_price, subtotal')
        .eq('order_id', order.id) as unknown as Promise<QueryResult<TrackingItemRow[]>>)

      if (itemResult.error) throw new OrderTrackingError(itemResult.error.message)
      const items = itemResult.data ?? []
      const fulfillment: TrackedOrder['fulfillment'] = { method: order.delivery_method }
      if (order.delivery_method === 'delivery') {
        if (order.delivery_address) fulfillment.address = order.delivery_address
        if (order.delivery_city) fulfillment.city = order.delivery_city
        if (order.delivery_state) fulfillment.state = order.delivery_state
      }

      return {
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        totalAmount: Number(order.total_amount),
        currency: 'NGN',
        customerName: order.customer_name,
        fulfillment,
        createdAt: order.created_at,
        items: items.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          total: Number(item.subtotal),
        })),
      }
    },
  }
}

export const orderTrackingService = createOrderTrackingService()
