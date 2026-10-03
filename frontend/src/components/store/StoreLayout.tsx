import type { ReactNode } from 'react'
import { StoreFooter } from './StoreFooter'
import { StoreHeader } from './StoreHeader'
import { useCart } from '../../context/cartHooks'

export function StoreLayout({ children }: { children: ReactNode }) {
  const { error } = useCart()
  return <div className="store-shell"><StoreHeader />{error && <p className="cart-api-notice store-container" role="alert">{error}</p>}{children}<StoreFooter /></div>
}
