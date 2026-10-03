import type { OrderStatus, PaymentStatus } from './adminOrdersApi'

export type CustomerRole = 'customer' | 'admin'

export type AdminCustomer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: CustomerRole
  created_at: string
  updated_at: string
}

export type CustomerOrderSummary = {
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  fulfillment: { method: 'delivery' | 'pickup' }
  createdAt: string
}

export type AdminCustomerDetail = {
  customer: AdminCustomer
  orders: CustomerOrderSummary[]
}

export class AdminCustomersApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminCustomersApiError'
  }
}

function getBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) throw new AdminCustomersApiError('The customer service is not configured.')
  return `${baseUrl}/admin/customers`
}

async function request<T>(path: string, accessToken: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      headers: { authorization: ['Bearer', accessToken].join(' ') },
    })
  } catch {
    throw new AdminCustomersApiError('Could not connect to customer management. Please try again.')
  }

  if (!response.ok) {
    let message = 'Unable to complete the customer request. Please try again.'
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Keep the readable fallback for non-JSON server responses.
    }
    throw new AdminCustomersApiError(message)
  }
  return response.json() as Promise<T>
}

export function listAdminCustomers(accessToken: string, filters: {
  search?: string
  role?: CustomerRole
  page: number
  pageSize: number
}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return request<{ customers: AdminCustomer[]; page: number; pageSize: number; total: number }>(`?${query}`, accessToken)
}

export async function getAdminCustomer(accessToken: string, id: string) {
  return request<AdminCustomerDetail>(`/${encodeURIComponent(id)}`, accessToken)
}
