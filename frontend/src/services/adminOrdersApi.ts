export const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const

export type OrderStatus = typeof orderStatuses[number]
export type PaymentStatus = typeof paymentStatuses[number]

export type AdminOrderSummary = {
  id: string
  orderNumber: string
  customerType: 'guest' | 'registered'
  customerName: string
  customerEmail: string
  customerPhone: string
  totalAmount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentReference: string | null
  fulfillment: {
    method: 'delivery' | 'pickup'
    address: string | null
    city: string | null
    state: string | null
  }
  createdAt: string
  updatedAt: string
}

export type AdminOrder = AdminOrderSummary & {
  items: { name: string; unitPrice: number; quantity: number; subtotal: number }[]
}

export type AdminOrderPage = {
  orders: AdminOrderSummary[]
  page: number
  pageSize: number
  total: number
}

export class AdminOrdersApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminOrdersApiError'
  }
}

function getBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) throw new AdminOrdersApiError('The order service is not configured.')
  return `${baseUrl}/admin/orders`
}

async function request<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: {
        authorization: ['Bearer', accessToken].join(' '),
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new AdminOrdersApiError('Could not connect to order management. Please try again.')
  }

  if (!response.ok) {
    let message = 'Unable to complete the order request. Please try again.'
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Keep the readable fallback for non-JSON server responses.
    }
    throw new AdminOrdersApiError(message)
  }

  return response.json() as Promise<T>
}

export function listAdminOrders(accessToken: string, filters: {
  search?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  createdAfter?: string
  page: number
  pageSize: number
}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return request<AdminOrderPage>(`?${query}`, accessToken)
}

export async function getAdminOrder(accessToken: string, id: string) {
  const result = await request<{ order: AdminOrder }>(`/${encodeURIComponent(id)}`, accessToken)
  return result.order
}

export async function updateAdminOrderStatus(accessToken: string, id: string, status: OrderStatus) {
  const result = await request<{ order: AdminOrderSummary }>(`/${encodeURIComponent(id)}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return result.order
}
