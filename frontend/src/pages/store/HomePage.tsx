import { CategoryCard } from '../../components/store/CategoryCard'
import { HeroSection } from '../../components/store/HeroSection'
import { ProductCard } from '../../components/store/ProductCard'
import { StoreIcon } from '../../components/store/StoreHeader'
import { storeCategories, featuredProducts } from '../../data/storeData'

export function HomePage() {
  return <main className="store-home">
    <HeroSection />
    <section className="store-section category-section" id="categories"><div className="store-container"><div className="store-section-heading"><div><span className="section-kicker">SHOP BY CATEGORY</span><h2>Find what you need,<br /><em>easily.</em></h2></div><a href="#categories" className="section-link">View all categories <StoreIcon name="arrow" size={15} /></a></div><div className="category-grid">{storeCategories.map((category) => <CategoryCard key={category.name} category={category} />)}</div></div></section>
    <section className="store-section featured-section" id="featured"><div className="store-container"><div className="store-section-heading"><div><span className="section-kicker">A FEW OF OUR FAVOURITES</span><h2>Popular right now.</h2></div><a href="#featured" className="section-link">Shop all products <StoreIcon name="arrow" size={15} /></a></div><div className="product-grid">{featuredProducts.map((product) => <ProductCard key={product.name} product={product} />)}</div></div></section>
    <section className="value-section"><div className="store-container value-inner"><div className="value-intro"><span className="section-kicker">THE MAJIDADI PROMISE</span><h2>Shopping that feels<br /><em>straightforward.</em></h2></div><div className="value-grid"><div><span className="value-number">01</span><strong>Quality products</strong><p>Carefully selected products from brands you can trust.</p></div><div><span className="value-number">02</span><strong>Secure payments</strong><p>Shop with confidence through safe, reliable checkout.</p></div><div><span className="value-number">03</span><strong>Reliable delivery</strong><p>We get your essentials to you, wherever you are.</p></div><div><span className="value-number">04</span><strong>Here to help</strong><p>Friendly support whenever you need a hand.</p></div></div></div></section>
  </main>
}
