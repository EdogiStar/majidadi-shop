import { Icon } from './AdminLayout'

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="search" /></div><strong>{title}</strong><p>{text}</p></div>
}
