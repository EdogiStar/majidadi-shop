import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../../components/admin/AdminLayout'
import { EmptyState } from '../../components/admin/EmptyState'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { useAuth } from '../../context/useAuth'
import { AdminOverviewApiError, getAdminOverview, type AdminOverview } from '../../services/adminOverviewApi'

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function MetricCard({ label, value, icon, tone, detail }: {
  label: string
  value: string
  icon: IconName
  tone: string
  detail: string
}) {
  return <div className="stat-card overview-metric"><div className="stat-top"><span className={`stat-icon stat-${tone}`}><Icon name={icon} size={19} /></span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="overview-metric-detail">{detail}</div></div>
}

export function DashboardPage() {
  const { session } = useAuth()
  const [result, setResult] = useState<{ key: string; data?: AdminOverview; error?: string } | null>(null)
  const [reload, setReload] = useState(0)
  const requestKey = `${session?.access_token ?? 'no-session'}:${reload}`

  useEffect(() => {
    if (!session?.access_token) return
    let active = true
    void getAdminOverview(session.access_token).then((data) => {
      if (active) setResult({ key: requestKey, data })
    }).catch((error: unknown) => {
      if (active) setResult({
        key: requestKey,
        error: error instanceof AdminOverviewApiError ? error.message : 'Unable to load the overview. Please try again.',
      })
    })
    return () => { active = false }
  }, [requestKey, session?.access_token])

  const currentResult = result?.key === requestKey ? result : null
  const data = currentResult?.data
  const loading = Boolean(session?.access_token) && !currentResult

  if (!session?.access_token) return <p className="admin-error" role="alert">Your administrator session is unavailable. Sign in again and retry.</p>
  if (loading) return <div className="admin-loading" role="status">Loading store overview…</div>
  if (currentResult?.error || !data) return <div className="page-stack"><p className="admin-error" role="alert">{currentResult?.error ?? 'Unable to load the overview.'}</p><button className="button button-secondary" onClick={() => setReload((value) => value + 1)}>Try again</button></div>

  const orderStatuses = [
    ['Pending', data.orders.pending],
    ['Processing', data.orders.processing],
    ['Shipped', data.orders.shipped],
    ['Delivered', data.orders.delivered],
    ['Cancelled', data.orders.cancelled],
  ] as const

  return <div className="dashboard">
    <div className="stats-grid">
      <MetricCard label="Paid revenue" value={formatPrice(data.totalRevenue)} icon="wallet" tone="blue" detail={`${data.paidOrderCount.toLocaleString()} paid orders · excludes cancelled orders`} />
      <MetricCard label="Total orders" value={data.orders.total.toLocaleString()} icon="orders" tone="purple" detail={`${data.orders.pending.toLocaleString()} pending fulfillment`} />
      <MetricCard label="Products" value={data.products.total.toLocaleString()} icon="package" tone="orange" detail={`${data.products.active} active · ${data.products.inactive} inactive`} />
      <MetricCard label="Registered customers" value={data.registeredCustomers.toLocaleString()} icon="users" tone="green" detail="Guest orders are not counted as customers" />
    </div>

    <div className="dashboard-grid overview-lower-grid">
      <section className="card overview-status-card">
        <div className="card-heading"><div><h2>Order fulfillment</h2><p>Current order count by fulfillment status</p></div><a className="text-link" href="/admin/orders">View orders <Icon name="arrow" size={15} /></a></div>
        <div className="overview-status-list">{orderStatuses.map(([status, count]) => <div className="overview-status-row" key={status}><StatusBadge>{status}</StatusBadge><strong>{count.toLocaleString()}</strong></div>)}</div>
      </section>
      <section className="card overview-inventory-card">
        <div className="card-heading"><div><h2>Inventory snapshot</h2><p>Product availability at a glance</p></div><a className="text-link" href="/admin/products">Manage products <Icon name="arrow" size={15} /></a></div>
        <div className="overview-inventory-total"><strong>{data.products.total.toLocaleString()}</strong><span>Total products</span></div>
        <div className="overview-inventory-breakdown"><span><i className="overview-dot overview-dot-active" />{data.products.active.toLocaleString()} active</span><span><i className="overview-dot overview-dot-inactive" />{data.products.inactive.toLocaleString()} inactive</span></div>
        <div className="overview-low-stock"><span><Icon name="alert" size={17} />Low-stock products (5 or fewer)</span><strong>{data.products.lowStock.toLocaleString()}</strong></div>
      </section>
    </div>

    <section className="card table-card recent-orders overview-recent-orders">
      <div className="card-heading"><div><h2>Recent orders</h2><p>The latest orders from your store</p></div><a className="text-link" href="/admin/orders">View all <Icon name="arrow" size={15} /></a></div>
      {data.recentOrders.length === 0 ? <EmptyState title="No orders yet" text="Orders will appear here after checkout." /> : <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th></tr></thead><tbody>
        {data.recentOrders.map((order) => <tr key={order.id}>
          <td><a className="order-number" href={`/admin/orders?orderId=${encodeURIComponent(order.id)}`}>{order.orderNumber}</a></td>
          <td><span className="admin-order-customer"><strong>{order.customerName}</strong><StatusBadge tone={order.customerType}>{order.customerType === 'guest' ? 'Guest' : 'Registered'}</StatusBadge></span></td>
          <td className="muted">{formatDate(order.createdAt)}</td>
          <td><strong>{formatPrice(order.totalAmount)}</strong></td>
          <td><StatusBadge tone={order.paymentStatus}>{order.paymentStatus}</StatusBadge></td>
          <td><StatusBadge>{order.status}</StatusBadge></td>
        </tr>)}
      </tbody></table></div>}
    </section>
  </div>
}
