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

export class AdminOverviewApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminOverviewApiError'
  }
}

export async function getAdminOverview(accessToken: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) throw new AdminOverviewApiError('The admin service is not configured.')

  let response: Response
  try {
    response = await fetch(`${baseUrl}/admin/overview`, {
      headers: { authorization: ['Bearer', accessToken].join(' ') },
    })
  } catch {
    throw new AdminOverviewApiError('Could not connect to the admin service. Please try again.')
  }

  if (!response.ok) {
    let message = 'Unable to load the store overview.'
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Retain the readable fallback when the server response is not JSON.
    }
    throw new AdminOverviewApiError(message)
  }
  return response.json() as Promise<AdminOverview>
}
