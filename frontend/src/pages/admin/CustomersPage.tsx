import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'
import { EmptyState } from '../../components/admin/EmptyState'
import { Icon } from '../../components/admin/AdminLayout'
import { StatusBadge } from '../../components/admin/StatusBadge'
import {
  AdminCustomersApiError,
  getAdminCustomer,
  listAdminCustomers,
  type AdminCustomer,
  type AdminCustomerDetail,
  type CustomerRole,
} from '../../services/adminCustomersApi'

const PAGE_SIZE = 20

function formatPrice(price: number) {
  return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

function readable(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function CustomersPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<CustomerRole | ''>('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: { customers: AdminCustomer[]; total: number }; error?: string } | null>(null)

  const requestKey = JSON.stringify([search, role, page, reload])
  useEffect(() => {
    if (!session?.access_token) return
    let active = true
    void listAdminCustomers(session.access_token, {
      search: search || undefined,
      role: role || undefined,
      page,
      pageSize: PAGE_SIZE,
    }).then((data) => {
      if (active) setResult({ key: requestKey, data })
    }).catch((error: unknown) => {
      if (active) setResult({
        key: requestKey,
        error: error instanceof AdminCustomersApiError ? error.message : 'Unable to load customers. Please try again.',
      })
    })
    return () => { active = false }
  }, [requestKey, search, role, page, reload, session?.access_token])

  const currentResult = result?.key === requestKey ? result : null
  const loading = !currentResult
  const customers = currentResult?.data?.customers ?? []
  const total = currentResult?.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(query.trim())
    setPage(1)
  }

  if (selectedId) {
    return <CustomerDetail id={selectedId} accessToken={session?.access_token ?? ''} onBack={() => setSelectedId('')} />
  }
  if (!session?.access_token) {
    return <p className="admin-error" role="alert">Your administrator session is unavailable. Sign in again and retry.</p>
  }

  return <div className="page-stack">
    <form className="page-toolbar admin-customer-filters" onSubmit={submitSearch}>
      <div className="filter-search"><Icon name="search" /><input aria-label="Search customers" placeholder="Search name, email, or phone..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <select aria-label="Filter by role" value={role} onChange={(event) => { setRole(event.target.value as CustomerRole | ''); setPage(1) }}>
        <option value="">All roles</option>
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
      </select>
      <button className="button button-primary" type="submit">Search</button>
    </form>
    {currentResult?.error && <div className="admin-error" role="alert"><span>{currentResult.error}</span><button className="button button-secondary" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
    <section className="card table-card">
      <div className="table-meta"><span><strong>{total.toLocaleString()}</strong> registered users</span><span className="muted">Page {page} of {pageCount}</span></div>
      {loading ? <div className="admin-loading" role="status">Loading customers…</div>
        : currentResult?.error ? null
          : customers.length === 0 ? <EmptyState title="No users found" text={search || role ? 'Try changing your search or role filter.' : 'Registered customers will appear here.'} />
            : <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>Role</th><th>Joined</th><th /></tr></thead><tbody>
              {customers.map((customer) => <tr key={customer.id}>
                <td><span className="admin-customer-cell"><span className="admin-customer-avatar">{(customer.full_name?.trim() || customer.email || '?').slice(0, 1).toUpperCase()}</span><span><strong>{customer.full_name || 'Name not provided'}</strong><small>{customer.email || 'Email unavailable'}</small></span></span></td>
                <td className="muted">{customer.phone || '—'}</td>
                <td><StatusBadge tone={customer.role}>{readable(customer.role)}</StatusBadge></td>
                <td className="muted">{formatDate(customer.created_at)}</td>
                <td><button className="table-action" aria-label={`View ${customer.full_name || customer.email || 'customer'}`} title="View customer" onClick={() => setSelectedId(customer.id)}><Icon name="external" size={16} /></button></td>
              </tr>)}
            </tbody></table></div>}
      {!loading && !currentResult?.error && total > 0 && <div className="admin-order-pagination"><button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}</span><button className="button button-secondary" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </section>
  </div>
}

function CustomerDetail({ id, accessToken, onBack }: { id: string; accessToken: string; onBack: () => void }) {
  const [result, setResult] = useState<{ key: string; detail?: AdminCustomerDetail; error?: string } | null>(null)
  const requestKey = id
  useEffect(() => {
    let active = true
    void getAdminCustomer(accessToken, id).then((detail) => {
      if (active) setResult({ key: requestKey, detail })
    }).catch((error: unknown) => {
      if (active) setResult({
        key: requestKey,
        error: error instanceof AdminCustomersApiError ? error.message : 'Unable to load this customer.',
      })
    })
    return () => { active = false }
  }, [accessToken, id, requestKey])

  const detail = result?.key === requestKey ? result.detail : undefined
  if (!detail && !result?.error) return <div className="admin-loading" role="status">Loading customer details…</div>
  if (result?.error || !detail) return <div className="page-stack"><button className="button button-secondary order-back-button" onClick={onBack}>← Back to customers</button><p className="admin-error" role="alert">{result?.error ?? 'Customer not found.'}</p></div>

  const { customer, orders } = detail
  return <div className="page-stack admin-customer-detail">
    <button className="button button-secondary order-back-button" onClick={onBack}>← Back to customers</button>
    <section className="card admin-order-detail-card">
      <div className="admin-order-detail-heading"><div><span className="section-kicker">CUSTOMER DETAILS</span><h2>{customer.full_name || 'Name not provided'}</h2><p>Registered {formatDate(customer.created_at)}</p></div><StatusBadge tone={customer.role}>{readable(customer.role)}</StatusBadge></div>
      <section className="admin-customer-profile">
        <h3>Account information</h3>
        <dl className="admin-order-definition-list"><div><dt>Email</dt><dd>{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : '—'}</dd></div><div><dt>Phone</dt><dd>{customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : '—'}</dd></div><div><dt>Role</dt><dd><StatusBadge tone={customer.role}>{readable(customer.role)}</StatusBadge></dd></div><div><dt>Joined</dt><dd>{formatDate(customer.created_at)}</dd></div></dl>
      </section>
      <section className="admin-customer-history">
        <h3>Order history <span>{orders.length}</span></h3>
        {orders.length === 0 ? <EmptyState title="No orders yet" text="This registered user has not placed an order while signed in." />
          : <div className="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th></tr></thead><tbody>
            {orders.map((order) => <tr key={order.orderNumber}><td><strong className="order-number">{order.orderNumber}</strong></td><td className="muted">{formatDate(order.createdAt)}</td><td><strong>{formatPrice(order.totalAmount)}</strong></td><td><StatusBadge tone={order.paymentStatus}>{readable(order.paymentStatus)}</StatusBadge></td><td><StatusBadge>{readable(order.status)}</StatusBadge></td></tr>)}
          </tbody></table></div>}
      </section>
    </section>
  </div>
}
