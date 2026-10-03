import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

export type OrderStatus = typeof ORDER_STATUSES[number]
export type PaymentStatus = typeof PAYMENT_STATUSES[number]

export type AdminOrderFilters = {
  search?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  createdAfter?: string
  page: number
  pageSize: number
}

type AdminOrderRow = {
  id: string
  order_number: string
  user_id: string | null
  total_amount: string | number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_reference: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_method: 'delivery' | 'pickup'
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  created_at: string
  updated_at: string
}

type AdminOrderItemRow = {
  product_name: string
  unit_price: string | number
  quantity: number
  subtotal: string | number
}

type DatabaseResult<T> = {
  data: T | null
  error: { message: string; code?: string } | null
  count?: number | null
}

type OrderQuery = {
  select: (columns: string, options?: { count?: 'exact' }) => OrderQuery
  eq: (column: string, value: string) => OrderQuery
  gte: (column: string, value: string) => OrderQuery
  or: (filters: string) => OrderQuery
  order: (column: string, options: { ascending: boolean }) => OrderQuery
  range: (from: number, to: number) => Promise<DatabaseResult<AdminOrderRow[]>>
  maybeSingle: () => Promise<DatabaseResult<AdminOrderRow>>
  update: (values: { status: OrderStatus }) => OrderQuery
  then: Promise<DatabaseResult<AdminOrderItemRow[]>>['then']
}

type AdminOrdersDatabase = Pick<SupabaseClient, 'from'>

export type AdminOrdersService = ReturnType<typeof createAdminOrdersService>

export class AdminOrdersError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = 'AdminOrdersError'
  }
}

const ORDER_FIELDS = 'id, order_number, user_id, total_amount, status, payment_status, payment_reference, customer_name, customer_email, customer_phone, delivery_method, delivery_address, delivery_city, delivery_state, created_at, updated_at'

function serializeOrder(order: AdminOrderRow) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerType: order.user_id ? 'registered' as const : 'guest' as const,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    totalAmount: Number(order.total_amount),
    status: order.status,
    paymentStatus: order.payment_status,
    paymentReference: order.payment_reference,
    fulfillment: {
      method: order.delivery_method,
      address: order.delivery_address,
      city: order.delivery_city,
      state: order.delivery_state,
    },
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  }
}

function safeSearchTerm(value: string) {
  return value.replace(/[(),\\%_*"]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function createAdminOrdersService(database: AdminOrdersDatabase = supabaseServer) {
  return {
    async list(filters: AdminOrderFilters) {
      let query = database
        .from('orders')
        .select(ORDER_FIELDS, { count: 'exact' }) as unknown as OrderQuery

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus)
      if (filters.createdAfter) query = query.gte('created_at', filters.createdAfter)
      const search = filters.search ? safeSearchTerm(filters.search) : ''
      if (search) {
        const term = `%${search}%`
        query = query.or([
          `order_number.ilike.${term}`,
          `customer_name.ilike.${term}`,
          `customer_email.ilike.${term}`,
          `payment_reference.ilike.${term}`,
        ].join(','))
      }

      const from = (filters.page - 1) * filters.pageSize
      const result = await query.order('created_at', { ascending: false })
        .range(from, from + filters.pageSize - 1)
      if (result.error) throw new AdminOrdersError(result.error.message, result.error.code)
      return {
        orders: (result.data ?? []).map(serializeOrder),
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.count ?? 0,
      }
    },

    async find(id: string) {
      const result = await (database
        .from('orders')
        .select(ORDER_FIELDS)
        .eq('id', id)
        .maybeSingle() as unknown as Promise<DatabaseResult<AdminOrderRow>>)
      if (result.error) throw new AdminOrdersError(result.error.message, result.error.code)
      if (!result.data) return null

      const itemsResult = await (database
        .from('order_items')
        .select('product_name, unit_price, quantity, subtotal')
        .eq('order_id', id) as unknown as Promise<DatabaseResult<AdminOrderItemRow[]>>)
      if (itemsResult.error) throw new AdminOrdersError(itemsResult.error.message, itemsResult.error.code)

      return {
        ...serializeOrder(result.data),
        items: (itemsResult.data ?? []).map((item) => ({
          name: item.product_name,
          unitPrice: Number(item.unit_price),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        })),
      }
    },

    async updateStatus(id: string, status: OrderStatus) {
      const result = await (database
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select(ORDER_FIELDS)
        .maybeSingle() as unknown as Promise<DatabaseResult<AdminOrderRow>>)
      if (result.error) throw new AdminOrdersError(result.error.message, result.error.code)
      return result.data ? serializeOrder(result.data) : null
    },
  }
}

export const adminOrdersService = createAdminOrdersService()
