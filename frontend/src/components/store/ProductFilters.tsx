type ProductFiltersProps = {
  category: string
  search: string
  sort: string
  onCategoryChange: (category: string) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: string) => void
}

const categories = ['All', 'Phones', 'Laptops', 'Stationery', 'Books', 'Accessories', 'Other']

export function ProductFilters({ category, search, sort, onCategoryChange, onSearchChange, onSortChange }: ProductFiltersProps) {
  return <div className="catalog-controls">
    <div className="catalog-search"><span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search products..." value={search} onChange={(event) => onSearchChange(event.target.value)} /></div>
    <div className="category-filter" aria-label="Product categories">{categories.map((item) => <button key={item} className={category === item.toLowerCase() ? 'selected' : ''} onClick={() => onCategoryChange(item.toLowerCase())}>{item}</button>)}</div>
    <label className="sort-control">Sort by <select value={sort} onChange={(event) => onSortChange(event.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="name">Name: A–Z</option></select></label>
  </div>
}
