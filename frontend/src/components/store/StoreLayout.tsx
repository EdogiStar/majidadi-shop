import type { ReactNode } from 'react'
import { StoreFooter } from './StoreFooter'
import { StoreHeader } from './StoreHeader'

export function StoreLayout({ children }: { children: ReactNode }) {
  return <div className="store-shell"><StoreHeader />{children}<StoreFooter /></div>
}
