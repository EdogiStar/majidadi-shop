import { Icon, type IconName } from './AdminLayout'

export function StatCard({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: IconName; tone: string }) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon stat-${tone}`}><Icon name={icon} size={19} /></span><span className="stat-period">vs last month</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className={`stat-change ${change.startsWith('-') ? 'negative' : ''}`}><Icon name="trend" size={14} /> {change}</div></div>
}
