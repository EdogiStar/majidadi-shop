import { StoreIcon } from './StoreHeader'

type Product = { name: string; category: string; price: string; oldPrice: string; visual: string; tone: string; badge: string }

export function ProductCard({ product }: { product: Product }) {
  return <article className="store-product-card"><div className={`product-visual product-visual-${product.tone}`}><span className="product-badge">{product.badge}</span><div className={`product-art product-art-${product.visual}`}><span>{product.visual === 'iphone' ? '15' : product.visual === 'laptop' ? 'M3' : product.visual === 'headphones' ? 'XM5' : 'NOTE'}</span></div><button className="product-favorite" aria-label={`Save ${product.name}`}>♡</button></div><div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><div className="product-price"><strong>{product.price}</strong>{product.oldPrice && <del>{product.oldPrice}</del>}</div><button className="product-add"><span>Add to cart</span><StoreIcon name="arrow" size={15} /></button></div></article>
}
