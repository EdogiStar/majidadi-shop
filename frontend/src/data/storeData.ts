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
  imageUrl?: string | null
  categorySlug?: string | undefined
  stockQuantity?: number
}

export const storeCategories = [
  { name: 'Phones', description: 'Smart picks for every budget', icon: 'phone', tone: 'blue' },
  { name: 'Laptops', description: 'Power your everyday work', icon: 'laptop', tone: 'violet' },
  { name: 'Stationery', description: 'Make every note count', icon: 'stationery', tone: 'orange' },
  { name: 'Books', description: 'Stories, ideas and more', icon: 'book', tone: 'green' },
  { name: 'Accessories', description: 'The finishing touches', icon: 'accessory', tone: 'pink' },
  { name: 'More', description: 'Find something useful', icon: 'more', tone: 'slate' },
]
