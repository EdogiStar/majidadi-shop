import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'
import type { AdminProductListFilters, Product, ProductCategory, ProductInput, ProductListFilters, ProductUpdate } from '../types/product.types.js'

export class ProductServiceError extends Error {
  constructor(message: string, readonly code?: string) {
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

type ProductWriteQuery = {
  insert: (values: ProductInput) => ProductWriteQuery
  update: (values: ProductUpdate) => ProductWriteQuery
  select: (columns: string) => ProductWriteQuery
  eq: (column: string, value: string) => ProductWriteQuery
  maybeSingle: () => Promise<{ data: Product | null; error: { message: string; code?: string } | null }>
  single: () => Promise<{ data: Product | null; error: { message: string; code?: string } | null }>
}

type AdminProfileQuery = {
  select: (columns: string) => AdminProfileQuery
  eq: (column: string, value: string) => AdminProfileQuery
  maybeSingle: () => Promise<{ data: { role: string } | null; error: { message: string } | null }>
}

type ProductDatabaseClient = Pick<SupabaseClient, 'from'>

export type ProductService = ReturnType<typeof createProductService>

const PRODUCT_FIELDS = 'id, category_id, name, slug, description, price, stock_quantity, image_url, is_active, created_at, updated_at'
const PRODUCT_COLUMNS = `${PRODUCT_FIELDS}, category:categories(id, name, slug)`
const FILTERED_PRODUCT_COLUMNS = `${PRODUCT_FIELDS}, category:categories!inner(id, name, slug)`

function escapeSearchTerm(term: string) {
  return term.replace(/[%_]/g, '\\$&')
}

export function createProductService(client: ProductDatabaseClient = supabaseServer) {
  return {
    async list(filters: ProductListFilters): Promise<Product[]> {
      let query = client
        .from('products')
        .select(filters.category
          ? FILTERED_PRODUCT_COLUMNS
          : PRODUCT_COLUMNS)
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
        .select(PRODUCT_COLUMNS)
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle() as unknown as Promise<{ data: Product | null; error: { message: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message)
      return result.data
    },

    async listAdmin(filters: AdminProductListFilters = {}): Promise<Product[]> {
      let query = client
        .from('products')
        .select(PRODUCT_COLUMNS)
        .order(filters.sortBy ?? 'created_at', { ascending: filters.sortDirection === 'asc' }) as unknown as ProductQuery

      if (filters.status === 'active') query = query.eq('is_active', true)
      if (filters.status === 'inactive') query = query.eq('is_active', false)
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.search) query = query.ilike('name', `%${escapeSearchTerm(filters.search)}%`)

      const { data, error } = await (query as unknown as Promise<{ data: Product[] | null; error: { message: string } | null }>)
      if (error) throw new ProductServiceError(error.message)
      return data ?? []
    },

    async getAdminById(id: string): Promise<Product | null> {
      const result = await (client
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', id)
        .maybeSingle() as unknown as Promise<{ data: Product | null; error: { message: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message)
      return result.data
    },

    async listCategories(): Promise<ProductCategory[]> {
      const result = await (client
        .from('categories')
        .select('id, name, slug')
        .order('name', { ascending: true }) as unknown as Promise<{ data: ProductCategory[] | null; error: { message: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message)
      return result.data ?? []
    },

    async isAdmin(userId: string): Promise<boolean> {
      const result = await (client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle() as unknown as Promise<{ data: { role: string } | null; error: { message: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message)
      return result.data?.role === 'admin'
    },

    async create(input: ProductInput): Promise<Product> {
      const result = await (client
        .from('products')
        .insert(input)
        .select(PRODUCT_COLUMNS)
        .single() as unknown as Promise<{ data: Product | null; error: { message: string; code?: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message, result.error.code)
      if (!result.data) throw new ProductServiceError('Product creation returned no product')
      return result.data
    },

    async update(id: string, input: ProductUpdate): Promise<Product | null> {
      const result = await (client
        .from('products')
        .update(input)
        .eq('id', id)
        .select(PRODUCT_COLUMNS)
        .maybeSingle() as unknown as Promise<{ data: Product | null; error: { message: string; code?: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message, result.error.code)
      return result.data
    },

    async deactivate(id: string): Promise<Product | null> {
      const result = await (client
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
        .select(PRODUCT_COLUMNS)
        .maybeSingle() as unknown as Promise<{ data: Product | null; error: { message: string; code?: string } | null }>)
      if (result.error) throw new ProductServiceError(result.error.message, result.error.code)
      return result.data
    },
  }
}

export const productService = createProductService()
