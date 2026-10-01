import { useMemo, useState } from 'react'
import { ProductFilters } from '../../components/store/ProductFilters'
import { ProductGrid } from '../../components/store/ProductGrid'
import { useProducts } from '../../hooks/useProducts'

function parsePrice(price: string) {
  return Number(price.replace(/[₦,]/g, ''))
}

export function ShopPage() {
  const params = new URLSearchParams(window.location.search)
  const [category, setCategory] = useState(params.get('category')?.toLowerCase() || 'all')
  const [search, setSearch] = useState(params.get('search') || '')
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const { products, loading, error, retry } = useProducts({
    category: category === 'all' ? undefined : category,
    search,
  })

  const updateUrl = (next: { category?: string; search?: string; sort?: string }) => {
    const nextCategory = next.category ?? category
    const nextSearch = next.search ?? search
    const nextSort = next.sort ?? sort
    const nextParams = new URLSearchParams()
    if (nextCategory !== 'all') nextParams.set('category', nextCategory)
    if (nextSearch) nextParams.set('search', nextSearch)
    if (nextSort !== 'featured') nextParams.set('sort', nextSort)
    const query = nextParams.toString()
    window.history.pushState({}, '', query ? `/shop?${query}` : '/shop')
    setCategory(nextCategory)
    setSearch(nextSearch)
    setSort(nextSort)
  }

  const sortedProducts = useMemo(() => [...products].sort((a, b) => {
      if (sort === 'price-asc') return parsePrice(a.price) - parsePrice(b.price)
      if (sort === 'price-desc') return parsePrice(b.price) - parsePrice(a.price)
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    }), [products, sort])

  const clearFilters = () => updateUrl({ category: 'all', search: '', sort: 'featured' })
  return <main className="store-catalog"><div className="store-container"><div className="catalog-heading"><div><span className="section-kicker">THE MAJIDADI CATALOG</span><h1>Shop</h1><p>Find useful, quality products for every part of your day.</p></div><span className="catalog-count">{loading ? 'Loading products…' : `${sortedProducts.length} products`}</span></div><ProductFilters category={category} search={search} sort={sort} onCategoryChange={(value) => updateUrl({ category: value })} onSearchChange={(value) => updateUrl({ search: value })} onSortChange={(value) => updateUrl({ sort: value })} />{loading ? <div className="store-api-state" role="status">Loading products…</div> : error ? <div className="store-api-state store-api-error" role="alert"><p>{error}</p><button className="store-button store-button-dark" onClick={retry}>Try again</button></div> : <ProductGrid products={sortedProducts} onClear={clearFilters} />}</div></main>
}
