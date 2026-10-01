import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../data/storeData'

const CART_STORAGE_KEY = 'majidadi-cart'

export type CartItem = {
  product: Product
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, quantity?: number) => void
  increaseQuantity: (productId: string) => void
  decreaseQuantity: (productId: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function parsePrice(price: string) {
  return Number(price.replace(/[^\d.]/g, '')) || 0
}

function readStoredCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<CartItem>
      return Boolean(candidate.product && typeof candidate.product.id === 'string' && typeof candidate.quantity === 'number' && Number.isInteger(candidate.quantity) && candidate.quantity > 0)
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Cart state remains usable when browser storage is unavailable.
    }
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = items.reduce((total, item) => total + parsePrice(item.product.price) * item.quantity, 0)
    const findItem = (productId: string) => items.find((item) => item.product.id === productId)

    return {
      items,
      itemCount,
      subtotal,
      addItem: (product, quantity = 1) => {
        const amount = Math.max(1, Math.floor(quantity))
        setItems((current) => {
          const existing = current.find((item) => item.product.id === product.id)
          if (existing) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + amount } : item)
          return [...current, { product, quantity: amount }]
        })
      },
      increaseQuantity: (productId) => {
        if (!findItem(productId)) return
        setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
      },
      decreaseQuantity: (productId) => {
        if (!findItem(productId)) return
        setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))
      },
      removeItem: (productId) => setItems((current) => current.filter((item) => item.product.id !== productId)),
      clearCart: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export { CartContext }
