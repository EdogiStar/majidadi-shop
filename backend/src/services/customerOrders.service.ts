import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

type QueryResult<T> = {
  data: T | null
  error: { message: string } | null
}

type OrderRow = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: string | number
  delivery_method: 'delivery' | 'pickup'
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  created_at: string
}

type OrderItemRow = {
  product_name: string
  quantity: number
  unit_price: string | number
  subtotal: string | number
}

type CustomerOrdersDatabase = Pick<SupabaseClient, 'from'>

export type CustomerOrdersService = ReturnType<typeof createCustomerOrdersService>

export class CustomerOrdersError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomerOrdersError'
  }
}

function serializeOrder(order: OrderRow, items?: OrderItemRow[]) {
  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    totalAmount: Number(order.total_amount),
    fulfillment: {
      method: order.delivery_method,
      ...(items && order.delivery_method === 'delivery' ? {
        address: order.delivery_address,
        city: order.delivery_city,
        state: order.delivery_state,
      } : {}),
    },
    createdAt: order.created_at,
    ...(items ? {
      items: items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        total: Number(item.subtotal),
      })),
    } : {}),
  }
}

export function createCustomerOrdersService(database: CustomerOrdersDatabase = supabaseServer) {
  return {
    async list(userId: string) {
      const result = await (database
        .from('orders')
        .select('id, order_number, status, payment_status, total_amount, delivery_method, delivery_address, delivery_city, delivery_state, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as unknown as Promise<QueryResult<OrderRow[]>>)
      if (result.error) throw new CustomerOrdersError(result.error.message)
      return (result.data ?? []).map((order) => serializeOrder(order))
    },

    async find(userId: string, orderNumber: string) {
      const result = await (database
        .from('orders')
        .select('id, order_number, status, payment_status, total_amount, delivery_method, delivery_address, delivery_city, delivery_state, created_at')
        .eq('user_id', userId)
        .eq('order_number', orderNumber)
        .maybeSingle() as unknown as Promise<QueryResult<OrderRow>>)
      if (result.error) throw new CustomerOrdersError(result.error.message)
      const order = result.data
      if (!order) return null

      const itemResult = await (database
        .from('order_items')
        .select('product_name, quantity, unit_price, subtotal')
        .eq('order_id', order.id) as unknown as Promise<QueryResult<OrderItemRow[]>>)
      if (itemResult.error) throw new CustomerOrdersError(itemResult.error.message)
      return serializeOrder(order, itemResult.data ?? [])
    },
  }
}

export const customerOrdersService = createCustomerOrdersService()
