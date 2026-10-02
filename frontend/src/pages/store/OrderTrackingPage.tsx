import { useState, type FormEvent } from 'react'
import { StoreIcon } from '../../components/store/StoreHeader'
import { formatNaira } from '../../context/cartUtils'
import { OrderTrackingApiError, trackOrder, type TrackedOrder } from '../../services/orderTrackingApi'

type TrackingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; order: TrackedOrder }
  | { status: 'not-found'; message: string }
  | { status: 'error'; message: string }

function isValidOrderNumber(value: string) {
  return /^MJD-[A-Z0-9]+-[A-F0-9]{8}$/i.test(value.trim())
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function displayStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function displayDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function OrderTrackingPage() {
  const query = new URLSearchParams(window.location.search)
  const [orderNumber, setOrderNumber] = useState(query.get('orderNumber') ?? '')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<TrackingState>({ status: 'idle' })
  const [validationError, setValidationError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedOrderNumber = orderNumber.trim().toUpperCase()
    const normalizedEmail = email.trim()
    if (!isValidOrderNumber(normalizedOrderNumber)) {
      setValidationError('Enter a valid order number.')
      setState({ status: 'idle' })
      return
    }
    if (!isValidEmail(normalizedEmail)) {
      setValidationError('Enter a valid email address.')
      setState({ status: 'idle' })
      return
    }
    setValidationError('')
    setState({ status: 'loading' })
    try {
      setState({ status: 'success', order: await trackOrder(normalizedOrderNumber, normalizedEmail) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to track this order right now.'
      if (error instanceof OrderTrackingApiError && error.status === 404) {
        setState({ status: 'not-found', message })
      } else {
        setState({ status: 'error', message })
      }
    }
  }

  const order = state.status === 'success' ? state.order : null
  const address = order?.fulfillment.method === 'delivery'
    ? [order.fulfillment.address, order.fulfillment.city, order.fulfillment.state].filter(Boolean).join(', ')
    : ''

  return <main className="order-tracking-page"><div className="store-container">
    <div className="tracking-heading"><span className="section-kicker">ORDER SUPPORT</span><h1>Track Your Order</h1><p>Enter your order number and the email address used during checkout.</p></div>
    <div className="tracking-layout">
      <form className="tracking-form" onSubmit={submit} noValidate>
        <label className="checkout-field" htmlFor="tracking-order-number"><span>Order number</span><input id="tracking-order-number" value={orderNumber} onChange={(event) => { setOrderNumber(event.target.value); setValidationError('') }} placeholder="MJD-..." autoComplete="off" /></label>
        <label className="checkout-field" htmlFor="tracking-email"><span>Email address</span><input id="tracking-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setValidationError('') }} placeholder="you@example.com" autoComplete="email" /></label>
        <button className="store-button store-button-dark" type="submit" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Looking up your order…' : 'Track Order'} {!['loading'].includes(state.status) && <StoreIcon name="arrow" size={16} />}</button>
        {validationError && <p className="tracking-message tracking-error" role="alert">{validationError}</p>}
        {state.status === 'not-found' && <p className="tracking-message tracking-error" role="alert">{state.message}</p>}
        {state.status === 'error' && <p className="tracking-message tracking-error" role="alert">{state.message}</p>}
      </form>
      {order && <section className="tracking-result" aria-live="polite">
        <div className="tracking-result-heading"><div><span className="section-kicker">ORDER DETAILS</span><h2>Order {order.orderNumber}</h2></div><span className="tracking-order-status">{displayStatus(order.status)}</span></div>
        <dl className="tracking-facts">
          <div><dt>Payment</dt><dd>{displayStatus(order.paymentStatus)}</dd></div>
          <div><dt>Order status</dt><dd>{displayStatus(order.status)}</dd></div>
          <div><dt>Fulfillment</dt><dd>{order.fulfillment.method === 'pickup' ? 'Pickup from Shop' : 'Home Delivery'}</dd></div>
          <div><dt>Total</dt><dd>{formatNaira(order.totalAmount)}</dd></div>
          <div><dt>Placed</dt><dd>{displayDate(order.createdAt)}</dd></div>
          {address && <div className="tracking-address"><dt>Delivery address</dt><dd>{address}</dd></div>}
        </dl>
        <h3>Items</h3>
        <ul className="tracking-items">{order.items.map((item, index) => <li key={`${item.name}-${index}`}><div><strong>{item.name}</strong><span>Qty: {item.quantity} · {formatNaira(item.unitPrice)} each</span></div><b>{formatNaira(item.total)}</b></li>)}</ul>
      </section>}
    </div>
  </div></main>
}
