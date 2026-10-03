import type { CustomerRole } from '../context/auth-context'

export type AdminRouteAccess = 'loading' | 'login' | 'shop' | 'error' | 'allow'

export function getAdminRouteAccess(input: {
  loading: boolean
  authenticated: boolean
  role: CustomerRole | null
  profileError: string
}): AdminRouteAccess {
  if (input.loading) return 'loading'
  if (!input.authenticated) return 'login'
  if (input.profileError || input.role === null) return 'error'
  return input.role === 'admin' ? 'allow' : 'shop'
}
