type CheckoutRequest = {
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_method: 'delivery' | 'pickup'
  delivery_address?: string
  delivery_city?: string
  delivery_state?: string
  items: { product_id: string; quantity: number }[]
}

type PaymentInitialization = {
  authorizationUrl: string
  reference: string
  orderNumber: string
}

type PaymentVerification = {
  verified: boolean
  orderNumber?: string
  message: string
}

export class PaymentApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentApiError'
  }
}

function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!baseUrl) throw new PaymentApiError('Payment service is not configured. Please contact the shop.')
  return baseUrl.replace(/\/+$/, '')
}

async function post<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new PaymentApiError('Could not connect to the payment service. Please try again.')
  }

  let payload: { error?: string } & Partial<T>
  try {
    payload = await response.json() as { error?: string } & Partial<T>
  } catch {
    throw new PaymentApiError('The payment service returned an invalid response.')
  }
  if (!response.ok) throw new PaymentApiError(payload.error || 'Unable to process payment. Please try again.')
  return payload as T
}

export function initializePayment(checkout: CheckoutRequest, accessToken?: string) {
  return post<PaymentInitialization>('/payments/initialize', checkout, accessToken)
}

export function verifyPayment(reference: string) {
  return post<PaymentVerification>('/payments/verify', { reference })
}
