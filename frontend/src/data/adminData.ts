export const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
  '/admin': { title: 'Overview', eyebrow: 'Workspace', description: 'Keep an eye on your store performance.' },
  '/admin/products': { title: 'Products', eyebrow: 'Catalog', description: 'Manage your product catalog and inventory.' },
  '/admin/orders': { title: 'Orders', eyebrow: 'Commerce', description: 'Track and manage customer orders.' },
  '/admin/customers': { title: 'Customers', eyebrow: 'Relationships', description: 'View customers and their order history.' },
  '/admin/payments': { title: 'Payments', eyebrow: 'Finance', description: 'Review payment activity and transaction status.' },
  '/admin/settings': { title: 'Settings', eyebrow: 'Workspace', description: 'Manage your store profile and preferences.' },
}

export const products = [
  { name: 'iPhone 15 Pro Max', category: 'Phones', price: '₦1,450,000', stock: 12, status: 'In stock', tone: 'green', sku: 'IPH-15PM-256' },
  { name: 'MacBook Air M3', category: 'Laptops', price: '₦1,850,000', stock: 7, status: 'In stock', tone: 'green', sku: 'MAC-AIR-M3' },
  { name: 'HP Pavilion 15', category: 'Laptops', price: '₦920,000', stock: 3, status: 'Low stock', tone: 'amber', sku: 'HP-PAV-15' },
  { name: 'Executive Notebook', category: 'Stationery', price: '₦8,500', stock: 0, status: 'Out of stock', tone: 'red', sku: 'STN-NBK-01' },
  { name: 'The Psychology of Money', category: 'Books', price: '₦12,000', stock: 26, status: 'In stock', tone: 'green', sku: 'BK-PSY-MNY' },
]

export const orders = [
  { id: '#MGS-1048', customer: 'Amina Yusuf', initials: 'AY', date: 'Oct 01, 2026', items: 3, total: '₦1,462,000', status: 'Processing', payment: 'Paid' },
  { id: '#MGS-1047', customer: 'Chinedu Okafor', initials: 'CO', date: 'Sep 30, 2026', items: 1, total: '₦920,000', status: 'Shipped', payment: 'Paid' },
  { id: '#MGS-1046', customer: 'Fatima Bello', initials: 'FB', date: 'Sep 29, 2026', items: 5, total: '₦86,500', status: 'Delivered', payment: 'Paid' },
  { id: '#MGS-1045', customer: 'David James', initials: 'DJ', date: 'Sep 28, 2026', items: 2, total: '₦28,500', status: 'Pending', payment: 'Pending' },
]

export const customers = [
  { name: 'Amina Yusuf', email: 'amina.yusuf@email.com', location: 'Abuja, FCT', orders: 8, spent: '₦3,840,000', joined: 'Jun 14, 2026', initials: 'AY' },
  { name: 'Chinedu Okafor', email: 'chinedu.o@email.com', location: 'Abuja, FCT', orders: 5, spent: '₦1,680,000', joined: 'Jul 02, 2026', initials: 'CO' },
  { name: 'Fatima Bello', email: 'fatima.bello@email.com', location: 'Kaduna', orders: 12, spent: '₦426,500', joined: 'May 28, 2026', initials: 'FB' },
  { name: 'David James', email: 'david.james@email.com', location: 'Abuja, FCT', orders: 2, spent: '₦51,000', joined: 'Sep 28, 2026', initials: 'DJ' },
]

export const payments = [
  { reference: 'PSK_8N3KJ2L1', customer: 'Amina Yusuf', amount: '₦1,462,000', date: 'Oct 01, 2026 · 10:42 AM', status: 'Successful' },
  { reference: 'PSK_7H2MD8Q4', customer: 'Chinedu Okafor', amount: '₦920,000', date: 'Sep 30, 2026 · 03:18 PM', status: 'Successful' },
  { reference: 'PSK_6F1LP5R9', customer: 'David James', amount: '₦28,500', date: 'Sep 28, 2026 · 11:05 AM', status: 'Pending' },
  { reference: 'PSK_5B9XC3V7', customer: 'Sarah Ibrahim', amount: '₦74,000', date: 'Sep 26, 2026 · 09:24 AM', status: 'Failed' },
]
