export type ProductCategory = {
  id: string
  name: string
  slug: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: string
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category: ProductCategory | null
}

export type ProductListFilters = {
  category?: string | undefined
  search?: string | undefined
}

export type AdminProductListFilters = {
  search?: string | undefined
  categoryId?: string | undefined
  status?: 'all' | 'active' | 'inactive' | undefined
  sortBy?: 'created_at' | 'name' | 'price' | 'stock_quantity' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export type ProductInput = {
  name: string
  slug: string
  description?: string | null
  price: number
  stock_quantity?: number
  category_id?: string | null
  image_url?: string | null
  is_active?: boolean
}

export type ProductUpdate = Partial<ProductInput>
