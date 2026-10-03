import { useEffect, useRef, useState } from 'react'
import { StoreIcon } from '../../components/store/StoreHeader'
import { useCart } from '../../context/cartHooks'
import { verifyPayment } from '../../services/paymentApi'

type VerificationState =
  | { status: 'verifying' }
  | { status: 'success'; orderNumber: string }
  | { status: 'failed'; message: string }

export function PaymentCallbackPage() {
  const { clearCart } = useCart()
  const started = useRef(false)
  const params = new URLSearchParams(window.location.search)
  const reference = params.get('reference') ?? params.get('trxref')
  const [state, setState] = useState<VerificationState>(() => reference
    ? { status: 'verifying' }
    : { status: 'failed', message: 'No payment reference was returned. You can go back to checkout and try again.' })

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!reference) return

    verifyPayment(reference)
      .then(async (result) => {
        if (result.verified && result.orderNumber) {
          await clearCart()
          setState({ status: 'success', orderNumber: result.orderNumber })
        } else {
          setState({ status: 'failed', message: result.message })
        }
      })
      .catch((error: unknown) => {
        setState({
          status: 'failed',
          message: error instanceof Error ? error.message : 'We could not verify this payment. Please contact the shop before trying again.',
        })
      })
  }, [clearCart, reference])

  return <main className="checkout-page"><div className="store-container checkout-empty" aria-live="polite">
    <div className="cart-empty-icon"><StoreIcon name="cart" size={28} /></div>
    {state.status === 'verifying' && <><span className="section-kicker">PAYMENT STATUS</span><h1>Verifying your payment</h1><p>Please wait while we confirm your transaction securely.</p></>}
    {state.status === 'success' && <><span className="section-kicker">PAYMENT CONFIRMED</span><h1>Payment successful!</h1><p>Your order number is <strong>{state.orderNumber}</strong></p><a href={`/track-order?orderNumber=${encodeURIComponent(state.orderNumber)}`} className="store-button store-button-dark">Track your order <StoreIcon name="arrow" size={16} /></a><a href="/shop" className="checkout-continue">Continue Shopping</a></>}
    {state.status === 'failed' && <><span className="section-kicker">PAYMENT NOT CONFIRMED</span><h1>We could not confirm payment</h1><p>{state.message}</p><a href="/checkout" className="store-button store-button-dark">Return to Checkout <StoreIcon name="arrow" size={16} /></a></>}
  </div></main>
}
