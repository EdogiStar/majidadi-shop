import { Icon, Avatar } from './AdminLayout'

export function AdminHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return <header className="topbar">
    <button className="icon-button menu-button" onClick={onOpenSidebar} aria-label="Open navigation"><Icon name="menu" /></button>
    <div className="topbar-search"><Icon name="search" size={17} /><input aria-label="Search" placeholder="Search anything..." /><kbd>⌘ K</kbd></div>
    <div className="topbar-actions"><button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={19} /><span /></button><div className="topbar-divider" /><button className="profile-menu"><Avatar initials="OA" small /><span className="profile-copy"><strong>Oluwaseun A.</strong><small>Administrator</small></span><Icon name="chevron" size={15} /></button></div>
  </header>
}
