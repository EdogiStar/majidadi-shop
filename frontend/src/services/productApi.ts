import type { Product } from '../data/storeData'

type ApiProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  price: string | number
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  category: { name: string; slug: string } | null
}

type ProductListResponse = { products: ApiProduct[] }
type ProductResponse = { product: ApiProduct }

export class ProductApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductApiError'
  }
}

function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!baseUrl) throw new ProductApiError('Product service is not configured. Set VITE_API_BASE_URL and restart the frontend.')
  return baseUrl.replace(/\/+$/, '')
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (error instanceof ProductApiError) throw error
    throw new ProductApiError('Could not connect to the product service. Please try again.')
  }

  if (!response.ok) {
    let message = 'Unable to load products. Please try again.'
    try {
      const body: { error?: string } = await response.json()
      if (body.error) message = body.error
    } catch {
      // Keep the generic API error when the response body is not JSON.
    }
    throw new ProductApiError(message)
  }

  try {
    return await response.json() as T
  } catch {
    throw new ProductApiError('The product service returned an invalid response.')
  }
}

export function mapStoreProduct(product: ApiProduct): Product {
  const price = Number(product.price)
  if (!Number.isFinite(price)) throw new ProductApiError('The product service returned an invalid product price.')

  const category = product.category?.name ?? 'Other'
  const lowerName = product.name.toLowerCase()
  const visual = lowerName.includes('iphone') ? 'iphone'
    : lowerName.includes('laptop') || lowerName.includes('macbook') ? 'laptop'
      : lowerName.includes('headphone') ? 'headphones'
        : lowerName.includes('notebook') ? 'notebook'
          : 'generic'
  const tone = visual === 'iphone' ? 'blue'
    : visual === 'laptop' ? 'silver'
      : visual === 'headphones' ? 'dark'
        : visual === 'notebook' ? 'gold'
          : 'silver'

  return {
    id: product.id,
    name: product.name,
    category,
    categorySlug: product.category?.slug ?? 'other',
    price: `₦${price.toLocaleString('en-NG')}`,
    oldPrice: '',
    visual,
    tone,
    badge: '',
    stock: product.stock_quantity <= 0 ? 'Out of stock' : product.stock_quantity <= 5 ? 'Low stock' : 'In stock',
    stockQuantity: product.stock_quantity,
    description: product.description ?? '',
    imageUrl: product.image_url,
  }
}

export async function fetchProducts(filters: { category?: string; search?: string } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.category && filters.category !== 'all') query.set('category', filters.category)
  if (filters.search?.trim()) query.set('search', filters.search.trim())
  const suffix = query.size ? `?${query}` : ''
  const response = await request<ProductListResponse>(`/products${suffix}`, signal)
  if (!Array.isArray(response.products)) throw new ProductApiError('The product service returned an invalid product list.')
  return response.products.map(mapStoreProduct)
}

export async function fetchProduct(id: string, signal?: AbortSignal) {
  const response = await request<ProductResponse>(`/products/${encodeURIComponent(id)}`, signal)
  if (!response.product) throw new ProductApiError('The product service returned an invalid product.')
  return mapStoreProduct(response.product)
}
