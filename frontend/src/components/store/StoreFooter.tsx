import { StoreIcon } from './StoreHeader'

export function StoreFooter() {
  return <footer className="store-footer">
    <div className="store-container footer-grid">
      <div className="footer-brand"><a href="/" className="store-brand"><span className="store-brand-mark">M</span><span><strong>majidadi</strong><small>GENERAL SERVICES</small></span></a><p>Your trusted destination for quality phones, laptops, stationery, books and everyday essentials.</p><span className="footer-location">Shop No. 2, Opposite Sunset, Along Abaji Area Council, FCT Abuja</span></div>
      <div className="footer-links"><h3>Shop</h3><a href="/#phones">Phones</a><a href="/#laptops">Laptops</a><a href="/#stationery">Stationery</a><a href="/#books">Books</a></div>
      <div className="footer-links"><h3>Customer care</h3><a href="/#help">Contact us</a><a href="/#delivery">Delivery information</a><a href="/#returns">Returns & exchanges</a><a href="/#faqs">FAQs</a></div>
      <div className="footer-contact"><h3>Need help?</h3><p>Our team is happy to help with your order.</p><strong>hello@majidadi.com</strong><strong>+234 800 000 0000</strong><a href="/#contact">Get in touch <StoreIcon name="arrow" size={15} /></a></div>
    </div>
    <div className="store-container footer-bottom"><span>© 2026 Majidadi General Services. All rights reserved.</span><span>Secure shopping · Built for everyday living</span></div>
  </footer>
}
