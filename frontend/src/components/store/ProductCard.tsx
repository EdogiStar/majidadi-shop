import { StoreIcon } from './StoreHeader'
import { useState } from 'react'
import { useCart } from '../../context/cartHooks'
import type { Product } from '../../data/storeData'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = async () => {
    if (await addItem(product)) {
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1800)
    }
  }
  return <article className="store-product-card"><div className={`product-visual product-visual-${product.tone}`}><a className="product-card-link" href={`/products/${product.id}`} aria-label={`View ${product.name}`}>{product.badge && <span className="product-badge">{product.badge}</span>}{product.imageUrl ? <img className="product-photo" src={product.imageUrl} alt={product.name} /> : <div className={`product-art product-art-${product.visual}`}><span>{product.name.slice(0, 2).toUpperCase()}</span></div>}</a><button className="product-favorite" aria-label={`Save ${product.name}`}>♡</button></div><div className="product-info"><span className="product-category">{product.category}</span><h3><a href={`/products/${product.id}`}>{product.name}</a></h3><div className="product-price"><strong>{product.price}</strong>{product.oldPrice && <del>{product.oldPrice}</del>}</div><button className="product-add" onClick={handleAdd} disabled={product.stockQuantity === 0}><span>{product.stockQuantity === 0 ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}</span><StoreIcon name="arrow" size={15} /></button></div></article>
}
