import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'
import { EmptyState } from '../../components/admin/EmptyState'
import { Icon } from '../../components/admin/AdminLayout'
import { StatusBadge } from '../../components/admin/StatusBadge'
import {
  AdminOrdersApiError,
  getAdminOrder,
  listAdminOrders,
  paymentStatuses,
  type AdminOrder,
  type AdminOrderPage,
  type AdminOrderSummary,
  type PaymentStatus,
} from '../../services/adminOrdersApi'

const PAGE_SIZE = 20
type DatePeriod = 'all' | 'today' | '7days' | '30days'

function dateCutoff(period: DatePeriod) {
  if (period === 'all') return undefined
  const date = new Date()
  if (period === 'today') date.setHours(0, 0, 0, 0)
  else date.setDate(date.getDate() - (period === '7days' ? 7 : 30))
  return date.toISOString()
}

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function readable(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

export function PaymentsPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [period, setPeriod] = useState<DatePeriod>('all')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: AdminOrderPage; error?: string } | null>(null)
  const [selected, setSelected] = useState<AdminOrderSummary | null>(null)

  const createdAfter = dateCutoff(period)
  const requestKey = JSON.stringify([search, paymentStatus, createdAfter, page, reload])

  useEffect(() => {
    if (!session?.access_token) return
    let active = true
    void listAdminOrders(session.access_token, {
      search: search || undefined,
      paymentStatus: paymentStatus || undefined,
      createdAfter,
      page,
      pageSize: PAGE_SIZE,
    }).then((data) => {
      if (active) setResult({ key: requestKey, data })
    }).catch((error: unknown) => {
      if (active) setResult({
        key: requestKey,
        error: error instanceof AdminOrdersApiError ? error.message : 'Unable to load payments. Please try again.',
      })
    })
    return () => { active = false }
  }, [requestKey, search, paymentStatus, createdAfter, page, reload, session?.access_token])

  const currentResult = result?.key === requestKey ? result : null
  const loading = !currentResult
  const records = currentResult?.data?.orders ?? []
  const total = currentResult?.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(query.trim())
    setPage(1)
  }

  if (selected) {
    return <PaymentDetail
      key={selected.id}
      orderSummary={selected}
      accessToken={session?.access_token ?? ''}
      onBack={() => setSelected(null)}
    />
  }
  if (!session?.access_token) {
    return <p className="admin-error" role="alert">Your administrator session is unavailable. Sign in again and retry.</p>
  }

  return <div className="page-stack">
    <form className="page-toolbar admin-payment-filters" onSubmit={submitSearch}>
      <div className="filter-search"><Icon name="search" /><input aria-label="Search payments" placeholder="Order, customer, email, or Paystack reference..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <select aria-label="Filter by payment status" value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value as PaymentStatus | ''); setPage(1) }}>
        <option value="">All payment statuses</option>
        {paymentStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}
      </select>
      <select aria-label="Filter by order date" value={period} onChange={(event) => { setPeriod(event.target.value as DatePeriod); setPage(1) }}>
        <option value="all">All time</option>
        <option value="today">Today</option>
        <option value="7days">Last 7 days</option>
        <option value="30days">Last 30 days</option>
      </select>
      <button className="button button-primary" type="submit">Search</button>
    </form>
    <p className="admin-payment-date-note">Dates use the order creation date; payment confirmation timestamps are not stored separately.</p>
    {currentResult?.error && <div className="admin-error" role="alert"><span>{currentResult.error}</span><button className="button button-secondary" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
    <section className="card table-card">
      <div className="table-meta"><span><strong>{total.toLocaleString()}</strong> payment records</span><span className="muted">Page {page} of {pageCount}</span></div>
      {loading ? <div className="admin-loading" role="status">Loading payment records…</div>
        : currentResult?.error ? null
          : records.length === 0 ? <EmptyState title="No payment records found" text={search || paymentStatus || period !== 'all' ? 'Try changing your search or filters.' : 'Payment records will appear here after checkout.'} />
            : <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Paystack reference</th><th>Amount</th><th>Payment status</th><th>Order date</th><th /></tr></thead><tbody>
              {records.map((record) => <tr key={record.id}>
                <td><strong className="order-number">{record.orderNumber}</strong></td>
                <td><span className="admin-order-customer"><strong>{record.customerType === 'guest' ? 'Guest' : record.customerName}</strong><small>{record.customerEmail}</small><StatusBadge tone={record.customerType}>{record.customerType === 'guest' ? 'Guest' : 'Registered'}</StatusBadge></span></td>
                <td className="admin-order-reference">{record.paymentReference ?? '—'}</td>
                <td><strong>{formatPrice(record.totalAmount)}</strong></td>
                <td><StatusBadge tone={record.paymentStatus}>{readable(record.paymentStatus)}</StatusBadge></td>
                <td className="muted">{formatDate(record.createdAt)}</td>
                <td><button className="table-action" aria-label={`View payment for ${record.orderNumber}`} title="View payment details" onClick={() => setSelected(record)}><Icon name="external" size={16} /></button></td>
              </tr>)}
            </tbody></table></div>}
      {!loading && !currentResult?.error && total > 0 && <div className="admin-order-pagination"><button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}</span><button className="button button-secondary" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </section>
  </div>
}

function PaymentDetail({ orderSummary, accessToken, onBack }: {
  orderSummary: AdminOrderSummary
  accessToken: string
  onBack: () => void
}) {
  const [result, setResult] = useState<{ order?: AdminOrder; error?: string } | null>(null)
  useEffect(() => {
    let active = true
    void getAdminOrder(accessToken, orderSummary.id).then((order) => {
      if (active) setResult({ order })
    }).catch((error: unknown) => {
      if (active) setResult({
        error: error instanceof AdminOrdersApiError ? error.message : 'Unable to load payment details.',
      })
    })
    return () => { active = false }
  }, [accessToken, orderSummary.id])

  if (!result) return <div className="admin-loading" role="status">Loading payment details…</div>
  if (result.error || !result.order) return <div className="page-stack"><button className="button button-secondary order-back-button" onClick={onBack}>← Back to payments</button><p className="admin-error" role="alert">{result.error ?? 'Payment record not found.'}</p></div>

  const order = result.order
  return <div className="page-stack admin-payment-detail">
    <button className="button button-secondary order-back-button" onClick={onBack}>← Back to payments</button>
    <section className="card admin-order-detail-card">
      <div className="admin-order-detail-heading"><div><span className="section-kicker">PAYMENT DETAILS</span><h2>{order.orderNumber}</h2><p>Order created {formatDate(order.createdAt)}</p></div><StatusBadge tone={order.paymentStatus}>{readable(order.paymentStatus)}</StatusBadge></div>
      <section className="admin-customer-profile">
        <h3>Payment record</h3>
        <dl className="admin-order-definition-list">
          <div><dt>Customer type</dt><dd><StatusBadge tone={order.customerType}>{order.customerType === 'guest' ? 'Guest' : 'Registered'}</StatusBadge></dd></div>
          <div><dt>Customer</dt><dd>{order.customerName}</dd></div>
          <div><dt>Email</dt><dd>{order.customerEmail ? <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a> : '—'}</dd></div>
          <div><dt>Phone</dt><dd>{order.customerPhone || '—'}</dd></div>
          <div><dt>Paystack reference</dt><dd className="admin-order-reference">{order.paymentReference ?? '—'}</dd></div>
          <div><dt>Amount</dt><dd><strong>{formatPrice(order.totalAmount)}</strong></dd></div>
          <div><dt>Payment status</dt><dd><StatusBadge tone={order.paymentStatus}>{readable(order.paymentStatus)}</StatusBadge></dd></div>
          <div><dt>Fulfillment status</dt><dd><StatusBadge>{readable(order.status)}</StatusBadge></dd></div>
        </dl>
      </section>
      <section className="admin-order-items">
        <h3>Order items</h3>
        {order.items.length === 0 ? <EmptyState title="No item details" text="No order item snapshots are available." />
          : <div className="admin-order-items-table"><div className="admin-order-item-row admin-order-item-heading"><span>Product</span><span>Unit price</span><span>Quantity</span><span>Subtotal</span></div>{order.items.map((item, index) => <div className="admin-order-item-row" key={`${item.name}-${index}`}><strong>{item.name}</strong><span>{formatPrice(item.unitPrice)}</span><span>{item.quantity}</span><strong>{formatPrice(item.subtotal)}</strong></div>)}</div>}
        <div className="admin-order-total"><span>Stored order total</span><strong>{formatPrice(order.totalAmount)}</strong></div>
      </section>
    </section>
  </div>
}
