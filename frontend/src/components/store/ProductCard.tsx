import { StoreIcon } from './StoreHeader'
import { useState } from 'react'
import { useCart } from '../../context/cartHooks'
import type { Product } from '../../data/storeData'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = () => { addItem(product); setAdded(true); window.setTimeout(() => setAdded(false), 1800) }
  return <article className="store-product-card"><div className={`product-visual product-visual-${product.tone}`}><a className="product-card-link" href={`/products/${product.id}`} aria-label={`View ${product.name}`}><span className="product-badge">{product.badge}</span><div className={`product-art product-art-${product.visual}`}><span>{product.visual === 'iphone' ? '15' : product.visual === 'laptop' ? 'M3' : product.visual === 'headphones' ? 'XM5' : 'NOTE'}</span></div></a><button className="product-favorite" aria-label={`Save ${product.name}`}>♡</button></div><div className="product-info"><span className="product-category">{product.category}</span><h3><a href={`/products/${product.id}`}>{product.name}</a></h3><div className="product-price"><strong>{product.price}</strong>{product.oldPrice && <del>{product.oldPrice}</del>}</div><button className="product-add" onClick={handleAdd}><span>{added ? 'Added to cart' : 'Add to cart'}</span><StoreIcon name="arrow" size={15} /></button></div></article>
}
