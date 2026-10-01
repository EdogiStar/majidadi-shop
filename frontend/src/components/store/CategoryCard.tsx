import { StoreIcon } from './StoreHeader'

type Category = { name: string; description: string; icon: string; tone: string }

export function CategoryCard({ category }: { category: Category }) {
  return <a className="category-card" href={`/#${category.name.toLowerCase()}`}><span className={`category-icon category-${category.tone}`}>{category.icon === 'more' ? <StoreIcon name="arrow" size={22} /> : category.name.slice(0, 1)}</span><span className="category-copy"><strong>{category.name}</strong><small>{category.description}</small></span><span className="category-arrow">↗</span></a>
}
