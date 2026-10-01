import { useCart } from '../../context/cartHooks'
import { formatNaira } from '../../context/cartUtils'
import type { CartItem as CartItemData } from '../../context/CartContext'
import { StoreIcon } from './StoreHeader'

function ProductVisual({ item }: { item: CartItemData }) {
  const { product } = item
  const label = product.visual === 'iphone' ? '15' : product.visual === 'laptop' ? 'M3' : product.visual === 'headphones' ? 'XM5' : 'NOTE'
  return <div className={`cart-item-visual product-visual-${product.tone}`}><div className={`product-art product-art-${product.visual}`}><span>{label}</span></div></div>
}

export function CartItem({ item }: { item: CartItemData }) {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart()
  const unitPrice = Number(item.product.price.replace(/[^\d.]/g, '')) || 0
  return <article className="cart-item">
    <ProductVisual item={item} />
    <div className="cart-item-info"><span className="product-category">{item.product.category}</span><h2>{item.product.name}</h2><span className="cart-unit-price">{formatNaira(unitPrice)} each</span></div>
    <div className="cart-item-quantity"><span>Quantity</span><div className="quantity-control"><button onClick={() => decreaseQuantity(item.product.id)} aria-label={`Decrease ${item.product.name} quantity`}>−</button><strong>{item.quantity}</strong><button onClick={() => increaseQuantity(item.product.id)} aria-label={`Increase ${item.product.name} quantity`}>+</button></div></div>
    <strong className="cart-line-total">{formatNaira(unitPrice * item.quantity)}</strong>
    <button className="cart-remove" onClick={() => removeItem(item.product.id)} aria-label={`Remove ${item.product.name}`}><StoreIcon name="close" size={15} /></button>
  </article>
}
