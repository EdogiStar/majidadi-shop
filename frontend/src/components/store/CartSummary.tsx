import { useCart } from '../../context/cartHooks'
import { formatNaira } from '../../context/cartUtils'

export function CartSummary() {
  const { subtotal } = useCart()
  return <aside className="cart-summary"><h2>Order summary</h2><div className="cart-summary-row"><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div><div className="cart-total-row"><span>Total</span><strong>{formatNaira(subtotal)}</strong></div><a href="/checkout" className="store-button store-button-dark cart-checkout-button">Proceed to Checkout</a></aside>
}
