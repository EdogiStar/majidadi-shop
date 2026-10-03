import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'
import { EmptyState } from '../../components/admin/EmptyState'
import { Icon } from '../../components/admin/AdminLayout'
import { StatusBadge } from '../../components/admin/StatusBadge'
import {
  AdminOrdersApiError,
  getAdminOrder,
  listAdminOrders,
  orderStatuses,
  paymentStatuses,
  updateAdminOrderStatus,
  type AdminOrder,
  type AdminOrderPage,
  type OrderStatus,
  type PaymentStatus,
} from '../../services/adminOrdersApi'

const PAGE_SIZE = 20

function formatPrice(price: number) {
  return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function readable(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

export function OrdersPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: AdminOrderPage; error?: string } | null>(null)
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('orderId') ?? '')
  const [notice, setNotice] = useState('')

  const requestKey = JSON.stringify([search, status, paymentStatus, page, reload])
  useEffect(() => {
    if (!session?.access_token) return
    let active = true
    void listAdminOrders(session.access_token, {
      search: search || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      page,
      pageSize: PAGE_SIZE,
    }).then((data) => {
      if (active) setResult({ key: requestKey, data })
    }).catch((error: unknown) => {
      if (active) setResult({
        key: requestKey,
        error: error instanceof AdminOrdersApiError ? error.message : 'Unable to load orders. Please try again.',
      })
    })
    return () => { active = false }
  }, [requestKey, search, status, paymentStatus, page, reload, session?.access_token])

  const currentResult = result?.key === requestKey ? result : null
  const loading = !currentResult
  const orders = currentResult?.data?.orders ?? []
  const total = currentResult?.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(query.trim())
    setPage(1)
    setNotice('')
  }

  const closeDetail = () => {
    setSelectedId('')
    const url = new URL(window.location.href)
    url.searchParams.delete('orderId')
    window.history.replaceState({}, '', url)
  }

  if (selectedId) {
    return <AdminOrderDetail
      key={selectedId}
      id={selectedId}
      accessToken={session?.access_token ?? ''}
      onBack={closeDetail}
      onUpdated={(message) => {
        setNotice(message)
        setReload((current) => current + 1)
      }}
    />
  }

  if (!session?.access_token) {
    return <p className="admin-error" role="alert">Your administrator session is unavailable. Sign in again and retry.</p>
  }

  return <div className="page-stack">
    <form className="page-toolbar admin-order-filters" onSubmit={submitSearch}>
      <div className="filter-search"><Icon name="search" /><input aria-label="Search orders" placeholder="Order number, customer, email, reference..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <select aria-label="Filter by payment status" value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value as PaymentStatus | ''); setPage(1) }}>
        <option value="">All payment statuses</option>
        {paymentStatuses.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
      </select>
      <select aria-label="Filter by order status" value={status} onChange={(event) => { setStatus(event.target.value as OrderStatus | ''); setPage(1) }}>
        <option value="">All order statuses</option>
        {orderStatuses.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
      </select>
      <button className="button button-primary" type="submit">Search</button>
    </form>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {currentResult?.error && <div className="admin-error" role="alert"><span>{currentResult.error}</span><button className="button button-secondary" onClick={() => setReload((current) => current + 1)}>Try again</button></div>}
    <section className="card table-card">
      <div className="table-meta"><span><strong>{total.toLocaleString()}</strong> orders</span><span className="muted">Page {page} of {pageCount}</span></div>
      {loading ? <div className="admin-loading" role="status">Loading orders…</div>
        : currentResult?.error ? null
          : orders.length === 0 ? <EmptyState title="No orders found" text={search || status || paymentStatus ? 'Try changing your search or filters.' : 'Orders will appear here after checkout.'} />
            : <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Order status</th><th>Payment</th><th /></tr></thead><tbody>
              {orders.map((order) => <tr key={order.id}>
                <td><strong className="order-number">{order.orderNumber}</strong></td>
                <td><span className="admin-order-customer"><strong>{order.customerName}</strong><small>{order.customerEmail}</small><StatusBadge tone={order.customerType}>{order.customerType === 'guest' ? 'Guest' : 'Registered'}</StatusBadge></span></td>
                <td className="muted">{formatDate(order.createdAt)}</td>
                <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                <td><StatusBadge>{readable(order.status)}</StatusBadge></td>
                <td><StatusBadge tone={order.paymentStatus}>{readable(order.paymentStatus)}</StatusBadge></td>
                <td><button className="table-action" aria-label={`View order ${order.orderNumber}`} title="View order" onClick={() => { setNotice(''); setSelectedId(order.id) }}><Icon name="external" size={16} /></button></td>
              </tr>)}
            </tbody></table></div>}
      {!loading && !currentResult?.error && total > 0 && <div className="admin-order-pagination"><button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}</span><button className="button button-secondary" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button></div>}
    </section>
  </div>
}

function AdminOrderDetail({ id, accessToken, onBack, onUpdated }: {
  id: string
  accessToken: string
  onBack: () => void
  onUpdated: (message: string) => void
}) {
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState<{ key: string; order?: AdminOrder; error?: string } | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const requestKey = `${id}:${reload}`

  useEffect(() => {
    let active = true
    void getAdminOrder(accessToken, id).then((order) => {
      if (active) setResult({ key: requestKey, order })
    }).catch((reason: unknown) => {
      if (active) setResult({
        key: requestKey,
        error: reason instanceof AdminOrdersApiError ? reason.message : 'Unable to load this order.',
      })
    })
    return () => { active = false }
  }, [accessToken, id, requestKey])

  const order = result?.key === requestKey ? result.order : undefined
  const loading = result?.key !== requestKey

  const saveStatus = async () => {
    if (!selectedStatus || !order || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await updateAdminOrderStatus(accessToken, id, selectedStatus)
      setNotice(`Order status updated to ${selectedStatus}.`)
      setSelectedStatus('')
      setReload((current) => current + 1)
      onUpdated('Order status updated successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update order status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading" role="status">Loading order details…</div>
  if (result?.error || !order) return <div className="page-stack"><button className="button button-secondary order-back-button" onClick={onBack}>← Back to orders</button><p className="admin-error" role="alert">{result?.error ?? 'Order not found.'}</p></div>

  return <div className="page-stack admin-order-detail">
    <button className="button button-secondary order-back-button" onClick={onBack}>← Back to orders</button>
    <section className="card admin-order-detail-card">
      <div className="admin-order-detail-heading"><div><span className="section-kicker">ORDER DETAILS</span><h2>{order.orderNumber}</h2><p>Placed {formatDate(order.createdAt)} · Updated {formatDate(order.updatedAt)}</p></div><StatusBadge tone={order.customerType}>{order.customerType === 'guest' ? 'Guest order' : 'Registered customer'}</StatusBadge></div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-order-detail-grid">
        <section><h3>Customer</h3><dl className="admin-order-definition-list"><div><dt>Name</dt><dd>{order.customerName}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></dd></div></dl></section>
        <section><h3>Payment</h3><dl className="admin-order-definition-list"><div><dt>Payment status</dt><dd><StatusBadge tone={order.paymentStatus}>{readable(order.paymentStatus)}</StatusBadge></dd></div><div><dt>Paystack reference</dt><dd className="admin-order-reference">{order.paymentReference ?? '—'}</dd></div><div><dt>Order total</dt><dd><strong>{formatPrice(order.totalAmount)}</strong></dd></div></dl></section>
        <section><h3>Fulfillment</h3><dl className="admin-order-definition-list"><div><dt>Method</dt><dd>{order.fulfillment.method === 'pickup' ? 'Pickup' : 'Delivery'}</dd></div>{order.fulfillment.method === 'delivery' && <div><dt>Address</dt><dd>{[order.fulfillment.address, order.fulfillment.city, order.fulfillment.state].filter(Boolean).join(', ') || '—'}</dd></div>}<div><dt>Current status</dt><dd><StatusBadge>{readable(order.status)}</StatusBadge></dd></div></dl></section>
        <section className="admin-order-status-control"><h3>Update fulfillment status</h3><div><select aria-label="New fulfillment status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as OrderStatus | '')}><option value="">Select a status</option>{orderStatuses.map((item) => <option key={item} value={item}>{readable(item)}</option>)}</select><button className="button button-primary" disabled={!selectedStatus || selectedStatus === order.status || saving} onClick={() => void saveStatus()}>{saving ? 'Saving…' : 'Update status'}</button></div><small>Payment status is verified separately by Paystack and cannot be changed here.</small></section>
      </div>
      <section className="admin-order-items"><h3>Items purchased</h3><div className="admin-order-items-table"><div className="admin-order-item-row admin-order-item-heading"><span>Product</span><span>Unit price</span><span>Quantity</span><span>Subtotal</span></div>{order.items.map((item, index) => <div className="admin-order-item-row" key={`${item.name}-${index}`}><strong>{item.name}</strong><span>{formatPrice(item.unitPrice)}</span><span>{item.quantity}</span><strong>{formatPrice(item.subtotal)}</strong></div>)}</div><div className="admin-order-total"><span>Stored order total</span><strong>{formatPrice(order.totalAmount)}</strong></div></section>
    </section>
  </div>
}
