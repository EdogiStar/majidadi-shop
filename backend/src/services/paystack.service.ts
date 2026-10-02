import type { PaystackInitialization, PaystackVerification } from '../types/payment.types.js'

export class PaystackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaystackError'
  }
}

export type PaystackGateway = {
  initialize: (input: {
    email: string
    amount: number
    reference: string
    callback_url: string
    metadata: { order_number: string }
  }) => Promise<PaystackInitialization>
  verify: (reference: string) => Promise<PaystackVerification>
}

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!secretKey) throw new PaystackError('Payment service is not configured')
  return secretKey
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`https://api.paystack.co${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${getSecretKey()}`,
        'content-type': 'application/json',
        ...init.headers,
      },
      signal: AbortSignal.timeout(15000),
    })
  } catch (error) {
    if (error instanceof PaystackError) throw error
    throw new PaystackError('Unable to connect to the payment service')
  }

  let body: { status?: boolean; data?: T }
  try {
    body = await response.json() as { status?: boolean; data?: T }
  } catch {
    throw new PaystackError('The payment service returned an invalid response')
  }
  if (!response.ok || !body.status || !body.data) {
    throw new PaystackError('The payment service could not complete the request')
  }
  return body.data
}

export const paystackGateway: PaystackGateway = {
  async initialize(input) {
    const data = await paystackRequest<PaystackInitialization>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    if (!data.authorization_url || !data.reference) {
      throw new PaystackError('The payment service returned an invalid initialization response')
    }
    try {
      const url = new URL(data.authorization_url)
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.paystack.com') {
        throw new PaystackError('The payment service returned an invalid checkout URL')
      }
    } catch (error) {
      if (error instanceof PaystackError) throw error
      throw new PaystackError('The payment service returned an invalid checkout URL')
    }
    return data
  },

  async verify(reference) {
    const data = await paystackRequest<PaystackVerification>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: 'GET' },
    )
    if (
      typeof data.reference !== 'string'
      || typeof data.status !== 'string'
      || !Number.isSafeInteger(data.amount)
      || typeof data.currency !== 'string'
      || !Number.isSafeInteger(data.id)
    ) {
      throw new PaystackError('The payment service returned an invalid verification response')
    }
    return data
  },
}
