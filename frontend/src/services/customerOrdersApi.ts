import type { Session } from '@supabase/supabase-js'

export type CustomerOrder = {
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  fulfillment: {
    method: 'delivery' | 'pickup'
    address?: string | null
    city?: string | null
    state?: string | null
  }
  createdAt: string
  items?: { name: string; quantity: number; unitPrice: number; total: number }[]
}

export class CustomerOrdersApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomerOrdersApiError'
  }
}

async function get<T>(path: string, session: Session): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) throw new CustomerOrdersApiError('The order service is not configured.')

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { authorization: `Bearer ${session.access_token}` },
    })
  } catch {
    throw new CustomerOrdersApiError('Could not connect to the order service. Please try again.')
  }

  let payload: { error?: string } & Partial<T>
  try {
    payload = await response.json() as { error?: string } & Partial<T>
  } catch {
    throw new CustomerOrdersApiError('The order service returned an invalid response.')
  }
  if (!response.ok) throw new CustomerOrdersApiError(payload.error || 'Unable to load your orders.')
  return payload as T
}

export function getCustomerOrders(session: Session) {
  return get<{ orders: CustomerOrder[] }>('/orders', session)
}

export function getCustomerOrder(session: Session, orderNumber: string) {
  return get<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(orderNumber)}`, session)
}
