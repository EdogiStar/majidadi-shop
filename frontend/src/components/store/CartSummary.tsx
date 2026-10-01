import { useCart } from '../../context/cartHooks'
import { formatNaira } from '../../context/cartUtils'

export function CartSummary() {
  const { subtotal } = useCart()
  const deliveryFee = subtotal >= 100000 ? 0 : 2500
  return <aside className="cart-summary"><h2>Order summary</h2><div className="cart-summary-row"><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div><div className="cart-summary-row"><span>Delivery</span><strong>{deliveryFee ? formatNaira(deliveryFee) : 'Free'}</strong></div><p className="delivery-note">Free delivery on orders of ₦100,000 or more. Orders below that qualify for a ₦2,500 delivery fee.</p><div className="cart-total-row"><span>Total</span><strong>{formatNaira(subtotal + deliveryFee)}</strong></div><a href="/checkout" className="store-button store-button-dark cart-checkout-button">Proceed to Checkout</a></aside>
}
