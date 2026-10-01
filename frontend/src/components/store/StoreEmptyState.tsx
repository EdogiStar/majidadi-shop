export function EmptyState({ onClear }: { onClear: () => void }) {
  return <div className="store-empty-state"><div className="store-empty-icon">⌕</div><h2>No products found</h2><p>Try a different search or category, or clear your filters to see everything.</p><button className="store-button store-button-dark" onClick={onClear}>Clear filters</button></div>
}
