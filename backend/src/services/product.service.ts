import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'
import type { Product, ProductListFilters } from '../types/product.types.js'

export class ProductServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductServiceError'
  }
}

type ProductQuery = {
  select: (columns: string) => ProductQuery
  eq: (column: string, value: string | boolean) => ProductQuery
  ilike: (column: string, value: string) => ProductQuery
  order: (column: string, options: { ascending: boolean }) => ProductQuery
  maybeSingle: () => Promise<{ data: Product | null; error: { message: string } | null }>
  then: Promise<{ data: Product[] | null; error: { message: string } | null }>['then']
}

type ProductDatabaseClient = Pick<SupabaseClient, 'from'>

export type ProductService = ReturnType<typeof createProductService>

function escapeSearchTerm(term: string) {
  return term.replace(/[%_]/g, '\\$&')
}

export function createProductService(client: ProductDatabaseClient = supabaseServer) {
  return {
    async list(filters: ProductListFilters): Promise<Product[]> {
      let query = client
        .from('products')
        .select('id, category_id, name, slug, description, price, stock_quantity, image_url, is_active, created_at, updated_at, category:categories(id, name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }) as unknown as ProductQuery

      if (filters.category) query = query.eq('category.slug', filters.category.toLowerCase())
      if (filters.search) query = query.ilike('name', `%${escapeSearchTerm(filters.search)}%`)

      const { data, error } = await (query as unknown as Promise<{ data: Product[] | null; error: { message: string } | null }>)
      if (error) throw new ProductServiceError(error.message)
      return data ?? []
    },

    async getById(id: string): Promise<Product | null> {
      const result = await (client
        .from('products')
        .select('id, category_id, name, slug, description, price, stock_quantity, image_url, is_active, created_at, updated_at, category:categories(id, name, slug)')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle() as unknown as Promise<{ data: Product | null; error: { message: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message)
      return result.data
    },
  }
}

export const productService = createProductService()
