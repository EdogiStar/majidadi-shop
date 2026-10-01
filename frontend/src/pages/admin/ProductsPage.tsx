import { useState } from 'react'
import { Icon } from '../../components/admin/AdminLayout'
import { EmptyState } from '../../components/admin/EmptyState'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { products } from '../../data/adminData'

export function ProductsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const filtered = products.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All categories' || item.category === category))
  return <div className="page-stack"><div className="page-toolbar"><div className="filter-search"><Icon name="search" /><input placeholder="Search products..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option><option>Phones</option><option>Laptops</option><option>Stationery</option><option>Books</option></select><button className="button button-primary"><Icon name="plus" size={17} /> Add product</button></div><section className="card table-card"><div className="table-meta"><span><strong>{filtered.length}</strong> products</span><button className="filter-button"><Icon name="filter" size={16} /> Filters</button></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((product) => <tr key={product.sku}><td><span className="product-cell"><span className="product-thumb product-thumb-large">{product.name.slice(0, 1)}</span><span><strong>{product.name}</strong><small>SKU: {product.sku}</small></span></span></td><td className="muted">{product.category}</td><td><strong>{product.price}</strong></td><td>{product.stock}</td><td><StatusBadge tone={product.tone}>{product.status}</StatusBadge></td><td><button className="table-action" aria-label={`Edit ${product.name}`}><Icon name="edit" size={16} /></button><button className="table-action danger" aria-label={`Delete ${product.name}`}><Icon name="trash" size={16} /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState title="No products found" text="Try adjusting your search or category filter." />}</div></section></div>
}
