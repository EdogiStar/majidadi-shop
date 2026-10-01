import { StoreIcon } from '../../components/store/StoreHeader'

export function CheckoutPage() {
  return <main className="store-not-found checkout-placeholder"><div className="store-container"><span className="section-kicker">COMING NEXT</span><h1>Checkout is not ready yet</h1><p>We are preparing secure checkout for Majidadi. Your cart is saved while we finish this step.</p><a href="/cart" className="store-button store-button-dark"><StoreIcon name="arrow" size={16} /> Back to cart</a></div></main>
}
