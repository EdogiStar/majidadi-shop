import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'
import { customerOrdersService, type CustomerOrdersService } from './customerOrders.service.js'

export type CustomerRole = 'customer' | 'admin'
export type CustomerFilters = {
  search?: string
  role?: CustomerRole
  page: number
  pageSize: number
}

export type AdminCustomer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: CustomerRole
  created_at: string
  updated_at: string
}

type CustomerDirectoryResult = {
  customers: AdminCustomer[] | null
  total: number
}

type ProfileRow = Omit<AdminCustomer, 'email'>
type DatabaseResult<T> = { data: T | null; error: { message: string; code?: string } | null }

type AdminCustomersDatabase = Pick<SupabaseClient, 'rpc' | 'from'> & {
  auth: Pick<SupabaseClient['auth'], 'admin'>
}

export type AdminCustomersService = ReturnType<typeof createAdminCustomersService>

export class AdminCustomersError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = 'AdminCustomersError'
  }
}

export function createAdminCustomersService(
  database: AdminCustomersDatabase = supabaseServer,
  orders: CustomerOrdersService = customerOrdersService,
) {
  return {
    async list(filters: CustomerFilters) {
      const result = await (database.rpc('admin_list_customers', {
        p_search: filters.search ?? null,
        p_role: filters.role ?? null,
        p_page: filters.page,
        p_page_size: filters.pageSize,
      }) as unknown as Promise<DatabaseResult<CustomerDirectoryResult>>)
      if (result.error) throw new AdminCustomersError(result.error.message, result.error.code)
      return {
        customers: result.data?.customers ?? [],
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.data?.total ?? 0,
      }
    },

    async find(id: string) {
      const profileResult = await (database
        .from('profiles')
        .select('id, full_name, phone, role, created_at, updated_at')
        .eq('id', id)
        .maybeSingle() as unknown as Promise<DatabaseResult<ProfileRow>>)
      if (profileResult.error) throw new AdminCustomersError(profileResult.error.message, profileResult.error.code)
      if (!profileResult.data) return null

      const authResult = await database.auth.admin.getUserById(id)
      if (authResult.error) throw new AdminCustomersError(authResult.error.message)
      const profile = profileResult.data
      return {
        customer: {
          ...profile,
          email: authResult.data.user.email ?? null,
        },
        orders: await orders.list(profile.id),
      }
    },
  }
}

export const adminCustomersService = createAdminCustomersService()
