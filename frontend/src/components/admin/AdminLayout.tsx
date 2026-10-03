import { useState } from 'react'
import type { ReactNode } from 'react'
import { pageMeta } from '../../data/adminData'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

export type IconName =
  | 'grid' | 'box' | 'orders' | 'users' | 'card' | 'settings' | 'search'
  | 'bell' | 'chevron' | 'arrow' | 'plus' | 'more' | 'menu' | 'close'
  | 'filter' | 'edit' | 'trash' | 'external' | 'trend' | 'package'
  | 'wallet' | 'alert' | 'download'

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    box: <><path d="m3.5 7 8.5 4.5L20.5 7" /><path d="M12 21V11.5" /><path d="m20 7-8-4-8 4v10l8 4 8-4V7Z" /></>,
    orders: <><path d="M5 4h14v17H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    users: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21c.6-3.5 3.2-5.5 7.5-5.5s6.9 2 7.5 5.5" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1H15V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    edit: <><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14.5 7.5 3 3" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></>,
    trend: <><path d="m4 16 5-5 4 3 7-8" /><path d="M15 6h5v5" /></>,
    package: <><path d="m3.5 7 8.5 4.5L20.5 7" /><path d="M12 21V11.5" /><path d="m20 7-8-4-8 4v10l8 4 8-4V7Z" /></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M2 8h19M16 13h3" /></>,
    alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function Avatar({ initials, imageUrl, small = false }: { initials: string; imageUrl?: string | null; small?: boolean }) {
  return <span className={`avatar ${small ? 'avatar-small' : ''}`}>{imageUrl ? <img src={imageUrl} alt="" /> : initials}</span>
}

export function AdminLayout({ children, path, onNavigate }: { children: ReactNode; path: string; onNavigate: (path: string) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const meta = pageMeta[path] ?? pageMeta['/admin']
  const navigate = (nextPath: string) => {
    onNavigate(nextPath)
    setSidebarOpen(false)
  }
  return <div className="admin-shell">
    <AdminSidebar path={path} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}
    <div className="admin-main"><AdminHeader onOpenSidebar={() => setSidebarOpen(true)} onNavigate={navigate} /><main className="content"><div className="page-heading"><div><div className="breadcrumb"><span>Admin</span><Icon name="chevron" size={13} /><strong>{meta.title}</strong></div><h1>{meta.title}</h1><p>{meta.description}</p></div>{path === '/admin' && <button className="button button-primary" onClick={() => navigate('/admin/products')}><Icon name="plus" size={17} /> Add product</button>}</div>{children}</main></div>
  </div>
}
