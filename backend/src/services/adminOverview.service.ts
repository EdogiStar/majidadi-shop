import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

export type AdminOverview = {
  totalRevenue: number
  paidOrderCount: number
  orders: {
    total: number
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  products: {
    total: number
    active: number
    inactive: number
    lowStock: number
  }
  registeredCustomers: number
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    customerType: 'guest' | 'registered'
    totalAmount: number
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
    createdAt: string
  }[]
}

type AdminOverviewDatabase = Pick<SupabaseClient, 'rpc'>
type DatabaseResult<T> = { data: T | null; error: { message: string; code?: string } | null }

export type AdminOverviewService = ReturnType<typeof createAdminOverviewService>

export class AdminOverviewError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = 'AdminOverviewError'
  }
}

export function createAdminOverviewService(database: AdminOverviewDatabase = supabaseServer) {
  return {
    async get(): Promise<AdminOverview> {
      const result = await (database.rpc('admin_get_overview_metrics') as unknown as Promise<DatabaseResult<AdminOverview>>)
      if (result.error) throw new AdminOverviewError(result.error.message, result.error.code)
      if (!result.data) throw new AdminOverviewError('Overview query returned no data')
      return result.data
    },
  }
}

export const adminOverviewService = createAdminOverviewService()
