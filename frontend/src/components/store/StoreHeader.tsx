import { useState } from 'react'
import { StoreNav } from './StoreNav'
import { StoreIcon } from './StoreNav'

export { StoreIcon } from './StoreNav'

export function StoreHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = ['Home', 'Shop', 'Phones', 'Laptops', 'Stationery', 'Books', 'Other categories']
  return <header className="store-header">
    <div className="store-header-main store-container">
      <button className="store-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open store navigation"><StoreIcon name="menu" /></button>
      <a href="/" className="store-brand"><span className="store-brand-mark">M</span><span><strong>majidadi</strong><small>GENERAL SERVICES</small></span></a>
      <div className="store-search"><StoreIcon name="search" size={18} /><input aria-label="Search products" placeholder="What are you looking for today?" /><button aria-label="Submit search">Search</button></div>
      <div className="store-actions"><button className="store-action account-action"><StoreIcon name="user" size={20} /><span><small>Welcome</small><strong>Account</strong></span></button><button className="store-action cart-action"><StoreIcon name="cart" size={21} /><span className="cart-count">2</span><span><small>Your cart</small><strong>₦1,458,500</strong></span></button></div>
    </div>
    <StoreNav links={links} open={mobileOpen} onClose={() => setMobileOpen(false)} />
  </header>
}
