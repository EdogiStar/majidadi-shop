export type Product = {
  id: string
  name: string
  category: string
  price: string
  oldPrice: string
  visual: string
  tone: string
  badge: string
  stock: string
  description: string
}

export const storeCategories = [
  { name: 'Phones', description: 'Smart picks for every budget', icon: 'phone', tone: 'blue' },
  { name: 'Laptops', description: 'Power your everyday work', icon: 'laptop', tone: 'violet' },
  { name: 'Stationery', description: 'Make every note count', icon: 'stationery', tone: 'orange' },
  { name: 'Books', description: 'Stories, ideas and more', icon: 'book', tone: 'green' },
  { name: 'Accessories', description: 'The finishing touches', icon: 'accessory', tone: 'pink' },
  { name: 'More', description: 'Find something useful', icon: 'more', tone: 'slate' },
]

export const featuredProducts: Product[] = [
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', category: 'Phones', price: '₦1,450,000', oldPrice: '₦1,520,000', visual: 'iphone', tone: 'blue', badge: 'Bestseller', stock: 'In stock', description: 'A powerful everyday phone with a beautiful display, pro camera system and all-day battery life.' },
  { id: 'macbook-air-m3', name: 'MacBook Air M3', category: 'Laptops', price: '₦1,850,000', oldPrice: '', visual: 'laptop', tone: 'silver', badge: '', stock: 'In stock', description: 'Light, capable and ready for work, study and creative projects wherever your day takes you.' },
  { id: 'sony-wh-1000xm5', name: 'Sony WH-1000XM5', category: 'Accessories', price: '₦385,000', oldPrice: '₦420,000', visual: 'headphones', tone: 'dark', badge: 'Save 8%', stock: 'In stock', description: 'Enjoy rich, detailed sound and calm focus with premium wireless noise-cancelling headphones.' },
  { id: 'executive-notebook-set', name: 'Executive Notebook Set', category: 'Stationery', price: '₦8,500', oldPrice: '', visual: 'notebook', tone: 'gold', badge: '', stock: 'Low stock', description: 'A refined notebook set for thoughtful notes, planning and keeping your best ideas close.' },
]
