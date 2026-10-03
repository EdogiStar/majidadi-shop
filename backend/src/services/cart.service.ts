import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

type QueryResult<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

type CartProduct = {
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

type CartItemRow = {
  id: string
  product_id: string
  quantity: number
  product: CartProduct | null
}

type CartRow = {
  id: string
  cart_items: CartItemRow[] | null
}

type CartQuery = {
  select: (columns: string) => CartQuery
  eq: (column: string, value: string) => CartQuery
  maybeSingle: () => Promise<QueryResult<CartRow>>
}

type CartItemQuery = {
  update: (values: { quantity: number }) => CartItemQuery
  delete: () => CartItemQuery
  eq: (column: string, value: string) => CartItemQuery
  select: (columns: string) => CartItemQuery
  maybeSingle: () => Promise<QueryResult<CartItemRow>>
}

type CartDatabase = Pick<SupabaseClient, 'from' | 'rpc'>

export type CartService = ReturnType<typeof createCartService>

export class CartServiceError extends Error {
  constructor(message: string, readonly statusCode = 500) {
    super(message)
    this.name = 'CartServiceError'
  }
}

const CART_SELECT = 'id, cart_items(id, product_id, quantity, product:products(id, name, slug, description, price, stock_quantity, image_url, is_active, category:categories(name, slug)))'

function serviceError(error: { message: string; code?: string }) {
  if (error.code === 'P0002') return new CartServiceError('Product is unavailable', 404)
  if (error.code === 'P0001') return new CartServiceError('Requested quantity exceeds available stock', 409)
  if (error.code === '22023') return new CartServiceError('Quantity must be between 1 and 100', 400)
  return new CartServiceError(error.message)
}

export function createCartService(database: CartDatabase = supabaseServer) {
  async function read(userId: string) {
    const result = await (database
      .from('carts')
      .select(CART_SELECT)
      .eq('user_id', userId)
      .maybeSingle() as unknown as Promise<QueryResult<CartRow>>)
    if (result.error) throw new CartServiceError(result.error.message)
    return (result.data?.cart_items ?? [])
      .filter((item) => item.product !== null)
      .map(({ id, product_id, quantity, product }) => ({ id, productId: product_id, quantity, product }))
  }

  async function getCartId(userId: string) {
    const cartResult = await (database
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle() as unknown as Promise<QueryResult<{ id: string }>>)
    if (cartResult.error) throw new CartServiceError(cartResult.error.message)
    return cartResult.data?.id ?? null
  }

  return {
    get: read,

    async add(userId: string, productId: string, quantity: number) {
      const { error } = await database.rpc('add_cart_item', {
        p_user_id: userId,
        p_product_id: productId,
        p_quantity: quantity,
      })
      if (error) throw serviceError(error)
      return read(userId)
    },

    async update(userId: string, productId: string, quantity: number) {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new CartServiceError('Quantity must be between 1 and 100', 400)
      }
      const cartId = await getCartId(userId)
      if (!cartId) return null
      const productResult = await (database
        .from('products')
        .select('stock_quantity, is_active')
        .eq('id', productId)
        .maybeSingle() as unknown as Promise<QueryResult<{ stock_quantity: number; is_active: boolean }>>)
      if (productResult.error) throw new CartServiceError(productResult.error.message)
      if (!productResult.data?.is_active) throw new CartServiceError('Product is unavailable', 404)
      if (quantity > productResult.data.stock_quantity) throw new CartServiceError('Requested quantity exceeds available stock', 409)
      const result = await (database
        .from('cart_items')
        .update({ quantity })
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .select('id, product_id, quantity')
        .maybeSingle() as unknown as Promise<QueryResult<CartItemRow>>)
      if (result.error) throw new CartServiceError(result.error.message)
      if (!result.data) return null
      return read(userId)
    },

    async remove(userId: string, productId: string) {
      const cartId = await getCartId(userId)
      if (!cartId) return read(userId)
      const { error } = await (database
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
        .eq('product_id', productId) as unknown as Promise<QueryResult<null>>)
      if (error) throw new CartServiceError(error.message)
      return read(userId)
    },

    async clear(userId: string) {
      const cartId = await getCartId(userId)
      if (!cartId) return []
      const { error } = await (database
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId) as unknown as Promise<QueryResult<null>>)
      if (error) throw new CartServiceError(error.message)
      return []
    },
  }
}

export const cartService = createCartService()
