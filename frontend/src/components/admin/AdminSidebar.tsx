import { Icon, type IconName } from './AdminLayout'

const navItems: { label: string; path: string; icon: IconName }[] = [
  { label: 'Overview', path: '/admin', icon: 'grid' },
  { label: 'Products', path: '/admin/products', icon: 'box' },
  { label: 'Orders', path: '/admin/orders', icon: 'orders' },
  { label: 'Customers', path: '/admin/customers', icon: 'users' },
  { label: 'Payments', path: '/admin/payments', icon: 'card' },
]

export function AdminSidebar({ path, onNavigate, open, onClose }: { path: string; onNavigate: (path: string) => void; open: boolean; onClose: () => void }) {
  const navigate = (nextPath: string) => {
    onNavigate(nextPath)
    onClose()
  }
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="brand"><span className="brand-mark">M</span><span className="brand-name">majidadi<span>.</span></span><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div>
    <div className="sidebar-label">Main menu</div>
    <nav className="sidebar-nav">{navItems.map((item) => <button key={item.path} className={`nav-item ${path === item.path ? 'nav-item-active' : ''}`} onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span>{item.label === 'Orders' && <span className="nav-count">4</span>}</button>)}</nav>
    <div className="sidebar-label sidebar-label-lower">System</div>
    <nav className="sidebar-nav"><button className={`nav-item ${path === '/admin/settings' ? 'nav-item-active' : ''}`} onClick={() => navigate('/admin/settings')}><Icon name="settings" /><span>Settings</span></button></nav>
    <div className="sidebar-help"><div className="help-icon"><Icon name="alert" size={16} /></div><strong>Need a hand?</strong><p>Our support team is here for you.</p><button>Contact support <Icon name="arrow" size={14} /></button></div>
    <div className="sidebar-footer"><span className="online-dot" /> Store is online <span className="footer-version">v1.0</span></div>
  </aside>
}
