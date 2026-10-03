import type { Product } from '../data/storeData'
import { mapStoreProduct } from './productApi'

type ApiCartItem = {
  id: string
  productId: string
  quantity: number
  product: Parameters<typeof mapStoreProduct>[0]
}

type CartResponse = { items: ApiCartItem[] }
export type ServerCartItem = { product: Product; quantity: number }

export class CartApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartApiError'
  }
}

function baseUrl() {
  const value = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!value) throw new CartApiError('Cart service is not configured.')
  return value.replace(/\/+$/, '')
}

async function request(path: string, accessToken: string, method = 'GET', body?: unknown) {
  let response: Response
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new CartApiError('Could not connect to the cart service. Please try again.')
  }
  if (!response.ok) {
    let message = 'Unable to update your cart.'
    try {
      const payload = await response.json() as { error?: string }
      if (payload.error) message = payload.error
    } catch {
      // Keep the generic error when the API response is not JSON.
    }
    throw new CartApiError(message)
  }
  let payload: CartResponse
  try {
    payload = await response.json() as CartResponse
  } catch {
    throw new CartApiError('The cart service returned an invalid response.')
  }
  if (!Array.isArray(payload.items)) throw new CartApiError('The cart service returned an invalid cart.')
  return payload.items.map((item) => ({ product: mapStoreProduct(item.product), quantity: item.quantity }))
}

export function getServerCart(accessToken: string) {
  return request('/cart', accessToken)
}

export function addServerCartItem(accessToken: string, productId: string, quantity: number) {
  return request('/cart/items', accessToken, 'POST', { product_id: productId, quantity })
}

export function updateServerCartItem(accessToken: string, productId: string, quantity: number) {
  return request(`/cart/items/${encodeURIComponent(productId)}`, accessToken, 'PATCH', { quantity })
}

export function removeServerCartItem(accessToken: string, productId: string) {
  return request(`/cart/items/${encodeURIComponent(productId)}`, accessToken, 'DELETE')
}

export function clearServerCart(accessToken: string) {
  return request('/cart', accessToken, 'DELETE')
}
