import { EmptyState } from './StoreEmptyState'
import { ProductCard } from './ProductCard'
import type { Product } from '../../data/storeData'

export function ProductGrid({ products, onClear }: { products: Product[]; onClear: () => void }) {
  if (products.length === 0) return <EmptyState onClear={onClear} />
  return <div className="product-grid catalog-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
}
