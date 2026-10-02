import { useEffect, useState } from 'react'
import { CustomerGate } from './CustomerPages'
import { useAuth } from '../../context/useAuth'
import { formatNaira } from '../../context/cartUtils'
import { CustomerOrdersApiError, getCustomerOrder, getCustomerOrders, type CustomerOrder } from '../../services/customerOrdersApi'

function readableStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function CustomerOrdersPage({ orderNumber }: { orderNumber?: string }) {
  const { session } = useAuth()
  const requestKey = orderNumber ? `order:${orderNumber}` : 'orders'
  const [result, setResult] = useState<{
    key: string
    orders?: CustomerOrder[]
    order?: CustomerOrder
    message?: string
  } | null>(null)
  const loading = result?.key !== requestKey
  const message = result?.key === requestKey ? result.message ?? '' : ''
  const orders = result?.key === requestKey ? result.orders ?? [] : []
  const order = result?.key === requestKey ? result.order ?? null : null

  useEffect(() => {
    if (!session) return
    let active = true
    const request = orderNumber
      ? getCustomerOrder(session, orderNumber).then(({ order: result }) => {
        if (active) setResult({ key: requestKey, order: result })
      })
      : getCustomerOrders(session).then(({ orders: result }) => {
        if (active) setResult({ key: requestKey, orders: result })
      })
    void request.catch((error: unknown) => {
      if (!active) return
      setResult({
        key: requestKey,
        message: error instanceof CustomerOrdersApiError ? error.message : 'Unable to load your orders. Please try again.',
      })
    })
    return () => { active = false }
  }, [orderNumber, requestKey, session])

  return <CustomerGate><main className="customer-page customer-orders-page"><section className="customer-card customer-orders-card">
    <span className="section-kicker">YOUR ACCOUNT</span>
    {orderNumber
      ? <><h1>Order {orderNumber}</h1><a className="customer-secondary-link" href="/orders">← Back to My Orders</a></>
      : <><h1>My Orders</h1><p className="customer-description">Orders placed while logged in to this account appear here.</p></>}
    {loading && <p className="customer-state">Loading your order information…</p>}
    {message && <p className="customer-error" role="alert">{message}</p>}
    {!loading && !message && !orderNumber && orders.length === 0 && <p className="customer-state">You have no orders associated with this account yet. Guest orders remain available through <a href="/track-order">Track Order</a>.</p>}
    {!loading && !message && !orderNumber && orders.length > 0 && <div className="customer-order-list">{orders.map((entry) => <article className="customer-order-row" key={entry.orderNumber}>
      <div><a href={`/orders/${encodeURIComponent(entry.orderNumber)}`}><strong>{entry.orderNumber}</strong></a><span>{new Date(entry.createdAt).toLocaleDateString()}</span></div>
      <div><span>Payment: {readableStatus(entry.paymentStatus)}</span><span>Order: {readableStatus(entry.status)}</span></div>
      <div><strong>{formatNaira(entry.totalAmount)}</strong><span>{entry.fulfillment.method === 'pickup' ? 'Pickup' : 'Home delivery'}</span></div>
    </article>)}</div>}
    {!loading && !message && orderNumber && order && <div className="customer-order-detail">
      <dl className="account-details"><div><dt>Payment</dt><dd>{readableStatus(order.paymentStatus)}</dd></div><div><dt>Order status</dt><dd>{readableStatus(order.status)}</dd></div><div><dt>Fulfillment</dt><dd>{order.fulfillment.method === 'pickup' ? 'Pickup' : 'Home delivery'}</dd></div><div><dt>Total</dt><dd>{formatNaira(order.totalAmount)}</dd></div><div><dt>Order date</dt><dd>{new Date(order.createdAt).toLocaleString()}</dd></div></dl>
      {order.fulfillment.method === 'delivery' && <p className="customer-address">{[order.fulfillment.address, order.fulfillment.city, order.fulfillment.state].filter(Boolean).join(', ')}</p>}
      <h2>Items</h2><div className="customer-order-items">{(order.items ?? []).map((item, index) => <div key={`${item.name}-${index}`}><strong>{item.name}</strong><span>Qty: {item.quantity} · {formatNaira(item.unitPrice)} each</span><b>{formatNaira(item.total)}</b></div>)}</div>
    </div>}
  </section></main></CustomerGate>
}
