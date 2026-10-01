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
