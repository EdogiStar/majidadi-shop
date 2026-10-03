import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { EmptyState } from '../../components/admin/EmptyState'
import { Icon } from '../../components/admin/AdminLayout'
import { StatusBadge } from '../../components/admin/StatusBadge'
import {
  deactivateAdminProduct,
  listAdminProductCategories,
  listAdminProducts,
  updateAdminProduct,
  type AdminProduct,
  type AdminProductCategory,
} from '../../services/adminProductApi'
import { ProductEditor } from './ProductEditor'

function formatPrice(price: string | number) {
  return `₦${Number(price).toLocaleString('en-NG')}`
}

export function ProductsPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminProductCategory[]>([])
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sort, setSort] = useState<'name' | 'price' | 'stock_quantity'>('name')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [creating, setCreating] = useState(false)
  const [reload, setReload] = useState(0)
  const [actionId, setActionId] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    setError('')
    setReload((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!session?.access_token) {
      return
    }
    const controller = new AbortController()
    void Promise.all([
      listAdminProducts(session.access_token),
      listAdminProductCategories(session.access_token),
    ]).then(([loadedProducts, loadedCategories]) => {
      if (controller.signal.aborted) return
      setError('')
      setProducts(loadedProducts)
      setCategories(loadedCategories)
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Unable to load products.')
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [session?.access_token, reload])
  const sessionError = !session?.access_token
    ? 'Your administrator session is unavailable. Sign in again and retry.'
    : ''

  const filteredProducts = useMemo(() => products
    .filter((product) => product.name.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((product) => !categoryId || product.category_id === categoryId)
    .filter((product) => status === 'all' || (status === 'active' ? product.is_active : !product.is_active))
    .sort((first, second) => {
      if (sort === 'price') return Number(first.price) - Number(second.price)
      if (sort === 'stock_quantity') return first.stock_quantity - second.stock_quantity
      return first.name.localeCompare(second.name)
    }), [products, query, categoryId, status, sort])

  const setSaved = (message: string) => {
    setCreating(false)
    setEditingProduct(null)
    setNotice(message)
    refresh()
  }

  const toggleProduct = async (product: AdminProduct) => {
    if (!session?.access_token) return
    const nextStatus = product.is_active ? 'deactivate' : 'reactivate'
    if (!window.confirm(`Are you sure you want to ${nextStatus} "${product.name}"?`)) return
    setActionId(product.id)
    setNotice('')
    setError('')
    try {
      if (product.is_active) {
        await deactivateAdminProduct(session.access_token, product.id)
      } else {
        await updateAdminProduct(session.access_token, product.id, { is_active: true })
      }
      setNotice(`Product ${product.is_active ? 'deactivated' : 'reactivated'} successfully.`)
      refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update product status.')
    } finally {
      setActionId('')
    }
  }

  if (creating || editingProduct) {
    return <ProductEditor
      key={editingProduct?.id ?? 'new-product'}
      product={editingProduct}
      categories={categories}
      accessToken={session?.access_token ?? ''}
      onCancel={() => { setCreating(false); setEditingProduct(null) }}
      onSaved={setSaved}
    />
  }

  return <div className="page-stack">
    <div className="page-toolbar product-toolbar">
      <div className="filter-search"><Icon name="search" /><input aria-label="Search products" placeholder="Search products..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <select aria-label="Filter by category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
        <option value="">All categories</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <select aria-label="Filter by product status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
        <option value="name">Name: A–Z</option>
        <option value="price">Price: Low to high</option>
        <option value="stock_quantity">Stock: Low to high</option>
      </select>
      <button className="button button-primary" onClick={() => { setNotice(''); setCreating(true) }}><Icon name="plus" size={17} /> Add Product</button>
    </div>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {(error || sessionError) && <div className="admin-error" role="alert"><span>{error || sessionError}</span>{!sessionError && <button className="button button-secondary" onClick={refresh}>Try again</button>}</div>}
    <section className="card table-card">
      <div className="table-meta"><span><strong>{filteredProducts.length}</strong> products</span><span className="muted">{products.filter((product) => product.is_active).length} active · {products.filter((product) => !product.is_active).length} inactive</span></div>
      {loading && !sessionError ? <div className="admin-loading" role="status">Loading products…</div> : !error && !sessionError && filteredProducts.length === 0 ? <EmptyState title="No products found" text={products.length ? 'Try adjusting the search or filters.' : 'Add your first product to populate the catalog.'} /> : !error && !sessionError && <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filteredProducts.map((product) => <tr key={product.id}>
          <td><span className="product-cell">{product.image_url ? <img className="admin-product-image" src={product.image_url} alt="" /> : <span className="product-thumb product-thumb-large">{product.name.slice(0, 1).toUpperCase()}</span>}<span><strong>{product.name}</strong><small>{product.slug}</small></span></span></td>
          <td className="muted">{product.category?.name ?? 'Uncategorized'}</td>
          <td><strong>{formatPrice(product.price)}</strong></td>
          <td><span className={product.stock_quantity <= 5 ? 'admin-low-stock' : ''}>{product.stock_quantity}</span></td>
          <td><StatusBadge tone={product.is_active ? 'paid' : 'cancelled'}>{product.is_active ? 'Active' : 'Inactive'}</StatusBadge></td>
          <td><div className="admin-product-actions"><button className="table-action" aria-label={`Edit ${product.name}`} title="Edit product" onClick={() => setEditingProduct(product)}><Icon name="edit" size={16} /></button><button className={`button ${product.is_active ? 'button-danger' : 'button-secondary'} product-status-action`} disabled={actionId === product.id} onClick={() => void toggleProduct(product)}>{actionId === product.id ? 'Saving…' : product.is_active ? 'Deactivate' : 'Reactivate'}</button></div></td>
        </tr>)}
      </tbody></table></div>}
    </section>
  </div>
}
