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
  items: {
    name: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}

export class OrderTrackingApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'OrderTrackingApiError'
    this.status = status
  }
}

export async function trackOrder(orderNumber: string, email: string): Promise<TrackedOrder> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) throw new OrderTrackingApiError('Order tracking is not configured. Please contact the shop.')

  const query = new URLSearchParams({ orderNumber, email })
  let response: Response
  try {
    response = await fetch(`${baseUrl}/orders/track?${query}`)
  } catch {
    throw new OrderTrackingApiError('Could not connect to the order tracking service.')
  }

  let payload: { order?: TrackedOrder; error?: string }
  try {
    payload = await response.json() as { order?: TrackedOrder; error?: string }
  } catch {
    throw new OrderTrackingApiError('The tracking service returned an invalid response.', response.status)
  }
  if (!response.ok || !payload.order) {
    throw new OrderTrackingApiError(payload.error || 'Unable to find this order.', response.status)
  }
  return payload.order
}
