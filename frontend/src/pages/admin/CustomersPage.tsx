import { useState } from 'react'
import { Avatar, Icon } from '../../components/admin/AdminLayout'
import { customers } from '../../data/adminData'

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const filtered = customers.filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page-stack"><div className="page-toolbar"><div className="filter-search"><Icon name="search" /><input placeholder="Search customers..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="button button-secondary"><Icon name="download" size={16} /> Export customers</button></div><section className="card table-card"><div className="table-meta"><span><strong>2,840</strong> customers</span><span className="muted">Updated just now</span></div><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Location</th><th>Orders</th><th>Total spent</th><th>Joined</th><th /></tr></thead><tbody>{filtered.map((customer) => <tr key={customer.email}><td><span className="customer-cell"><Avatar initials={customer.initials} small /><span><strong>{customer.name}</strong><small>{customer.email}</small></span></span></td><td className="muted">{customer.location}</td><td>{customer.orders}</td><td><strong>{customer.spent}</strong></td><td className="muted">{customer.joined}</td><td><button className="table-action"><Icon name="external" size={16} /></button></td></tr>)}</tbody></table></div></section></div>
}
