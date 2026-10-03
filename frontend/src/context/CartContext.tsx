import { createContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Product } from '../data/storeData'
import { addServerCartItem, clearServerCart, getServerCart, removeServerCartItem, updateServerCartItem, type ServerCartItem } from '../services/cartApi'
import { useAuth } from './useAuth'

const CART_STORAGE_KEY = 'majidadi-cart'

export type CartItem = ServerCartItem

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  loading: boolean
  error: string
  addItem: (product: Product, quantity?: number) => Promise<boolean>
  increaseQuantity: (productId: string) => Promise<void>
  decreaseQuantity: (productId: string) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
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
      return Boolean(candidate.product && typeof candidate.product.id === 'string'
        && typeof candidate.quantity === 'number'
        && Number.isInteger(candidate.quantity)
        && candidate.quantity > 0)
    })
  } catch {
    return []
  }
}

function writeStoredCart(items: CartItem[]) {
  try {
    if (items.length) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    else localStorage.removeItem(CART_STORAGE_KEY)
  } catch {
    // Guest cart remains usable in memory when browser storage is unavailable.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth()
  const [items, setItems] = useState<CartItem[]>(readStoredCart)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartOwnerId, setCartOwnerId] = useState<string | null>(null)
  const syncId = useRef(0)
  const accessToken = session?.access_token

  useEffect(() => {
    if (authLoading) return
    const requestId = ++syncId.current
    let active = true
    if (!user || !accessToken) {
      void Promise.resolve().then(() => {
        if (!active || requestId !== syncId.current) return
        setItems(readStoredCart())
        setCartOwnerId(null)
        setError('')
        setLoading(false)
      })
      return () => { active = false }
    }

    void (async () => {
      await Promise.resolve()
      if (!active || requestId !== syncId.current) return
      setLoading(true)
      setError('')
      let current: CartItem[]
      try {
        current = await getServerCart(accessToken)
        if (!active || requestId !== syncId.current) return
        setCartOwnerId(user.id)
        setItems(current)
      } catch (reason) {
        if (active && requestId === syncId.current) {
          setCartOwnerId(user.id)
          setItems([])
          setError(reason instanceof Error ? reason.message : 'Unable to load your saved cart.')
          setLoading(false)
        }
        return
      }

      let guestItems = readStoredCart()
      for (const guestItem of guestItems) {
        try {
          current = await addServerCartItem(accessToken, guestItem.product.id, guestItem.quantity)
          if (!active || requestId !== syncId.current) return
          setItems(current)
          guestItems = guestItems.filter((item) => item.product.id !== guestItem.product.id)
          writeStoredCart(guestItems)
        } catch (reason) {
          if (active && requestId === syncId.current) {
            setError(reason instanceof Error ? reason.message : 'Unable to merge your guest cart.')
          }
          break
        }
      }
      if (active && requestId === syncId.current) {
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [accessToken, authLoading, user])

  useEffect(() => {
    if (!authLoading && !user && cartOwnerId === null) writeStoredCart(items)
  }, [authLoading, cartOwnerId, items, user])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = items.reduce((total, item) => total + parsePrice(item.product.price) * item.quantity, 0)
    const findItem = (productId: string) => items.find((item) => item.product.id === productId)

    const updateRemoteCart = async (operation: (token: string) => Promise<CartItem[]>) => {
      if (!accessToken) return false
      try {
        const nextItems = await operation(accessToken)
        setItems(nextItems)
        setError('')
        return true
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to update your cart.')
        return false
      }
    }

    return {
      items,
      itemCount,
      subtotal,
      loading,
      error,
      addItem: async (product, quantity = 1) => {
        if (user && loading) return false
        const amount = Math.max(1, Math.floor(quantity))
        if (accessToken) return updateRemoteCart((token) => addServerCartItem(token, product.id, amount))
        setItems((current) => {
          const existing = current.find((item) => item.product.id === product.id)
          if (existing) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + amount } : item)
          return [...current, { product, quantity: amount }]
        })
        setError('')
        return true
      },
      increaseQuantity: async (productId) => {
        if (user && loading) return
        const existing = findItem(productId)
        if (!existing) return
        if (accessToken) {
          await updateRemoteCart((token) => updateServerCartItem(token, productId, existing.quantity + 1))
          return
        }
        setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
      },
      decreaseQuantity: async (productId) => {
        if (user && loading) return
        const existing = findItem(productId)
        if (!existing || existing.quantity <= 1) return
        if (accessToken) {
          await updateRemoteCart((token) => updateServerCartItem(token, productId, existing.quantity - 1))
          return
        }
        setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
      },
      removeItem: async (productId) => {
        if (user && loading) return
        if (accessToken) {
          await updateRemoteCart((token) => removeServerCartItem(token, productId))
          return
        }
        setItems((current) => current.filter((item) => item.product.id !== productId))
      },
      clearCart: async () => {
        if (user && loading) return
        if (accessToken) {
          await updateRemoteCart(clearServerCart)
          return
        }
        setItems([])
        setError('')
      },
    }
  }, [accessToken, error, items, loading, user])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export { CartContext }
