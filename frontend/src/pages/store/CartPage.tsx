import { CartItem } from '../../components/store/CartItem'
import { CartSummary } from '../../components/store/CartSummary'
import { StoreIcon } from '../../components/store/StoreHeader'
import { useCart } from '../../context/cartHooks'

export function CartPage() {
  const { items, itemCount, clearCart } = useCart()
  if (items.length === 0) return <main className="cart-page"><div className="store-container cart-empty"><div className="cart-empty-icon"><StoreIcon name="cart" size={28} /></div><span className="section-kicker">READY WHEN YOU ARE</span><h1>Your cart is empty</h1><p>Browse our catalog and add something useful for your day.</p><a href="/shop" className="store-button store-button-dark">Start Shopping <StoreIcon name="arrow" size={16} /></a></div></main>
  return <main className="cart-page"><div className="store-container"><div className="cart-heading"><div><span className="section-kicker">YOUR MAJIDADI ORDER</span><h1>Your Cart</h1><p>{itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout.</p></div><button className="cart-clear-button" onClick={clearCart}>Clear cart</button></div><div className="cart-layout"><section className="cart-items">{items.map((item) => <CartItem key={item.product.id} item={item} />)}<a href="/shop" className="continue-shopping">← Continue Shopping</a></section><CartSummary /></div></div></main>
}
