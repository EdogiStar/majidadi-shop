import { useState } from 'react'
import { StoreNav } from './StoreNav'
import { StoreIcon } from './StoreNav'
import { useCart } from '../../context/cartHooks'
import { formatNaira } from '../../context/cartUtils'
import { useAuth } from '../../context/useAuth'

export { StoreIcon } from './StoreNav'

export function StoreHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, subtotal } = useCart()
  const { user, loading } = useAuth()
  const links = ['Home', 'Shop', 'Phones', 'Laptops', 'Stationery', 'Books', 'Other categories']
  return <header className="store-header">
    <div className="store-header-main store-container">
      <button className="store-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open store navigation"><StoreIcon name="menu" /></button>
      <a href="/" className="store-brand"><span className="store-brand-mark">M</span><span><strong>majidadi</strong><small>GENERAL SERVICES</small></span></a>
      <div className="store-search"><StoreIcon name="search" size={18} /><input aria-label="Search products" placeholder="What are you looking for today?" /><button aria-label="Submit search">Search</button></div>
      <div className="store-actions">{!loading && <a href={user ? '/account' : '/login'} className="store-action account-action"><StoreIcon name="user" size={20} /><span><small>{user ? 'Welcome' : 'Customer'}</small><strong>{user ? 'Account' : 'Login'}</strong></span></a>}<a href="/cart" className="store-action cart-action"><StoreIcon name="cart" size={21} /><span className="cart-count">{itemCount}</span><span><small>Your cart</small><strong>{formatNaira(subtotal)}</strong></span></a></div>
    </div>
    <StoreNav links={links} open={mobileOpen} onClose={() => setMobileOpen(false)} />
  </header>
}
