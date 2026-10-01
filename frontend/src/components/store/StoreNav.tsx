type StoreIconName = 'search' | 'cart' | 'user' | 'menu' | 'close' | 'arrow' | 'chevron'

export function StoreIcon({ name, size = 20 }: { name: StoreIconName; size?: number }) {
  const icons = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    cart: <><path d="M3 4h2l2.2 11h10.9l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21c.6-3.5 3.2-5.5 7.5-5.5s6.9 2 7.5 5.5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

export function StoreNav({ links, open, onClose }: { links: string[]; open: boolean; onClose: () => void }) {
  return <nav className={`store-nav ${open ? 'store-nav-open' : ''}`}><div className="store-container store-nav-inner"><div className="store-mobile-nav-heading"><strong>Shop Majidadi</strong><button onClick={onClose} aria-label="Close store navigation"><StoreIcon name="close" /></button></div>{links.map((link, index) =>   <a key={link} href={index === 0 ? '/' : link === 'Shop' ? '/shop' : `/shop?category=${link === 'Other categories' ? 'other' : link.toLowerCase()}`} className={index === 0 ? 'active' : ''} onClick={onClose}>{link}{link === 'Other categories' && <StoreIcon name="chevron" size={14} />}</a>)}</div></nav>
}
