import { useState } from 'react'
import { ProductCard } from '../../components/store/ProductCard'
import { StoreIcon } from '../../components/store/StoreHeader'
import { featuredProducts } from '../../data/storeData'
import { useCart } from '../../context/cartHooks'

export function ProductDetailsPage({ productId }: { productId: string }) {
  const product = featuredProducts.find((item) => item.id === productId)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  if (!product) return <main className="store-not-found"><div className="store-container"><span className="section-kicker">SORRY, WE COULDN'T FIND THAT</span><h1>Product not found</h1><p>This product may have moved or is no longer available in the catalog.</p><a href="/shop" className="store-button store-button-dark">Back to shop <StoreIcon name="arrow" size={16} /></a></div></main>
  const related = featuredProducts.filter((item) => item.category === product.category && item.id !== product.id)
  return <main className="product-details-page"><div className="store-container"><a href="/shop" className="back-to-shop">← Back to shop</a><div className="product-details"><div className={`details-visual product-visual-${product.tone}`}><span className="product-badge">{product.badge}</span><div className={`product-art product-art-${product.visual}`}><span>{product.visual === 'iphone' ? '15' : product.visual === 'laptop' ? 'M3' : product.visual === 'headphones' ? 'XM5' : 'NOTE'}</span></div></div><div className="details-copy"><span className="product-category">{product.category}</span><h1>{product.name}</h1><div className="details-price"><strong>{product.price}</strong>{product.oldPrice && <del>{product.oldPrice}</del>}</div><p className="details-description">{product.description}</p><div className="stock-status"><span /> {product.stock}</div><div className="quantity-row"><span>Quantity</span><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity(quantity + 1)}>+</button></div></div><button className="store-button store-button-dark details-add" onClick={() => { addItem(product, quantity); setAdded(true) }}>{added ? 'Added to cart' : 'Add to cart'} <StoreIcon name="arrow" size={17} /></button></div></div>{related.length > 0 && <section className="related-products"><div className="store-section-heading"><div><span className="section-kicker">YOU MAY ALSO LIKE</span><h2>More from {product.category.toLowerCase()}.</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}</div></main>
}
