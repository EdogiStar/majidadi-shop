import { useState } from 'react'
import { Avatar, Icon } from '../../components/admin/AdminLayout'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { orders } from '../../data/adminData'

export function OrdersPage() {
  const [query, setQuery] = useState('')
  const filtered = orders.filter((order) => `${order.id} ${order.customer}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page-stack"><div className="page-toolbar"><div className="filter-search"><Icon name="search" /><input placeholder="Search by order or customer..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select defaultValue="All statuses"><option>All statuses</option><option>Processing</option><option>Shipped</option><option>Delivered</option></select><button className="button button-secondary"><Icon name="download" size={16} /> Export</button></div><section className="card table-card"><div className="table-meta"><span><strong>1,248</strong> orders</span><button className="filter-button"><Icon name="filter" size={16} /> More filters</button></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><strong className="order-number">{order.id}</strong></td><td><span className="customer-cell"><Avatar initials={order.initials} small />{order.customer}</span></td><td className="muted">{order.date}</td><td className="muted">{order.items} items</td><td><strong>{order.total}</strong></td><td><StatusBadge>{order.status}</StatusBadge></td><td><StatusBadge tone={order.payment.toLowerCase()}>{order.payment}</StatusBadge></td><td><button className="table-action"><Icon name="external" size={16} /></button></td></tr>)}</tbody></table></div></section></div>
}
