export type AdminProductCategory = {
  id: string
  name: string
  slug: string
}

export type AdminProduct = {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: string | number
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category: AdminProductCategory | null
}

export type AdminProductInput = {
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category_id: string
  image_url: string | null
  is_active: boolean
}

export type AdminProductUpdate = Partial<AdminProductInput>

export class AdminProductApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminProductApiError'
  }
}

function getBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) throw new AdminProductApiError('The product service is not configured.')
  return `${baseUrl}/admin/products`
}

async function request<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new AdminProductApiError('Could not connect to product management. Please try again.')
  }

  if (!response.ok) {
    let message = 'Unable to complete the product request. Please try again.'
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Retain the readable fallback for non-JSON server responses.
    }
    throw new AdminProductApiError(message)
  }

  return response.json() as Promise<T>
}

export async function listAdminProducts(accessToken: string, filters: {
  search?: string
  categoryId?: string
  status?: 'all' | 'active' | 'inactive'
  sortBy?: 'created_at' | 'name' | 'price' | 'stock_quantity'
  sortDirection?: 'asc' | 'desc'
} = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value)
  }
  const result = await request<{ products: AdminProduct[] }>(query.size ? `?${query}` : '', accessToken)
  return result.products
}

export async function listAdminProductCategories(accessToken: string) {
  const result = await request<{ categories: AdminProductCategory[] }>('/categories', accessToken)
  return result.categories
}

export async function getAdminProduct(accessToken: string, id: string) {
  const result = await request<{ product: AdminProduct }>(`/${encodeURIComponent(id)}`, accessToken)
  return result.product
}

export async function createAdminProduct(accessToken: string, input: AdminProductInput) {
  const result = await request<{ product: AdminProduct }>('', accessToken, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return result.product
}

export async function updateAdminProduct(accessToken: string, id: string, input: AdminProductUpdate) {
  const result = await request<{ product: AdminProduct }>(`/${encodeURIComponent(id)}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return result.product
}

export async function deactivateAdminProduct(accessToken: string, id: string) {
  const result = await request<{ product: AdminProduct }>(`/${encodeURIComponent(id)}`, accessToken, {
    method: 'DELETE',
  })
  return result.product
}
