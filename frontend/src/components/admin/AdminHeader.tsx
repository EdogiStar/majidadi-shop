import { useState } from 'react'
import { Icon, Avatar } from './AdminLayout'
import { useAuth } from '../../context/useAuth'
import { getProfileInitials } from '../../services/profilePresentation'

export function AdminHeader({ onOpenSidebar, onNavigate }: { onOpenSidebar: () => void; onNavigate: (path: string) => void }) {
  const { user, role, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const logout = async () => {
    const result = await signOut()
    if (result.error) {
      setLogoutError(result.error)
      return
    }
    setMenuOpen(false)
  }

  const name = profile?.full_name?.trim() || user?.email || 'Administrator'

  return <header className="topbar">
    <button className="icon-button menu-button" onClick={onOpenSidebar} aria-label="Open navigation"><Icon name="menu" /></button>
    <div className="topbar-search"><Icon name="search" size={17} /><input aria-label="Search" placeholder="Search anything..." /><kbd>⌘ K</kbd></div>
    <div className="topbar-actions"><button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={19} /><span /></button><div className="topbar-divider" /><div className="profile-menu-wrap">
      <button className="profile-menu" aria-expanded={menuOpen} aria-haspopup="true" onClick={() => { setMenuOpen((open) => !open); setLogoutError('') }}>
        <Avatar initials={getProfileInitials(profile?.full_name, user?.email)} imageUrl={profile?.avatar_url} small />
        <span className="profile-copy"><strong>{name}</strong><small>{role === 'admin' ? 'Administrator' : 'Account'}</small></span>
        <Icon name="chevron" size={15} />
      </button>
      {menuOpen && <div className="profile-dropdown">
        <button onClick={() => { setMenuOpen(false); onNavigate('/admin/settings') }}>Account settings</button>
        <button onClick={() => void logout()}>Log out</button>
        {logoutError && <p role="alert">{logoutError}</p>}
      </div>}
    </div></div>
  </header>
}
