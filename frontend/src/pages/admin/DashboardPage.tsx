import { Avatar, Icon } from '../../components/admin/AdminLayout'
import { StatCard } from '../../components/admin/StatCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { orders, products } from '../../data/adminData'

function SalesChart() {
  return <div className="chart-card card"><div className="card-heading"><div><h2>Sales overview</h2><p>Revenue performance over the last 7 months</p></div><select defaultValue="7 months" aria-label="Chart period"><option>7 months</option><option>30 days</option><option>12 months</option></select></div><div className="chart-summary"><strong>₦8,426,500</strong><span className="positive">+18.4%</span></div><div className="chart"><div className="chart-y"><span>₦2.0m</span><span>₦1.5m</span><span>₦1.0m</span><span>₦500k</span><span>₦0</span></div><div className="chart-area"><div className="chart-grid"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 680 220" preserveAspectRatio="none" aria-label="Sales chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".16" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs><path d="M0 181 C50 168 60 143 112 151 S170 130 224 143 S270 116 332 125 S390 94 446 110 S510 52 563 72 S630 50 680 25 V220 H0Z" fill="url(#fill)" /><path d="M0 181 C50 168 60 143 112 151 S170 130 224 143 S270 116 332 125 S390 94 446 110 S510 52 563 72 S630 50 680 25" fill="none" stroke="#2563eb" strokeWidth="3" /></svg><div className="chart-x"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div></div></div>
}

function RecentOrders() {
  return <section className="card table-card recent-orders"><div className="card-heading"><div><h2>Recent orders</h2><p>The latest orders from your store</p></div><a className="text-link" href="/admin/orders">View all <Icon name="arrow" size={15} /></a></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.slice(0, 4).map((order) => <tr key={order.id}><td><strong className="order-number">{order.id}</strong></td><td><span className="customer-cell"><Avatar initials={order.initials} small />{order.customer}</span></td><td className="muted">{order.date}</td><td><strong>{order.total}</strong></td><td><StatusBadge>{order.status}</StatusBadge></td></tr>)}</tbody></table></div></section>
}

function LowStock() {
  return <section className="card low-stock"><div className="card-heading"><div><h2>Low stock</h2><p>Products that need your attention</p></div><a className="text-link" href="/admin/products">View all <Icon name="arrow" size={15} /></a></div><div className="stock-list">{products.filter((product) => product.stock < 5).map((product) => <div className="stock-row" key={product.sku}><div className="product-thumb">{product.name.slice(0, 1)}</div><div className="stock-info"><strong>{product.name}</strong><span>{product.category}</span></div><div className={`stock-number ${product.stock === 0 ? 'stock-zero' : ''}`}>{product.stock}<small> left</small></div></div>)}</div></section>
}

function QuickActions() {
  return <section className="card quick-actions"><div className="card-heading"><div><h2>Quick actions</h2><p>Common tasks for your store</p></div></div><div className="quick-grid"><button><span className="quick-icon quick-blue"><Icon name="plus" /></span><span><strong>Add a product</strong><small>Create a new catalog item</small></span><Icon name="arrow" size={16} /></button><button><span className="quick-icon quick-purple"><Icon name="orders" /></span><span><strong>View pending orders</strong><small>4 orders need attention</small></span><Icon name="arrow" size={16} /></button><button><span className="quick-icon quick-orange"><Icon name="download" /></span><span><strong>Export sales report</strong><small>Download a CSV report</small></span><Icon name="arrow" size={16} /></button></div></section>
}

export function DashboardPage() {
  return <div className="dashboard"><div className="stats-grid"><StatCard label="Total sales" value="₦8,426,500" change="+18.4%" icon="wallet" tone="blue" /><StatCard label="Total orders" value="1,248" change="+12.6%" icon="orders" tone="purple" /><StatCard label="Total products" value="386" change="+4.2%" icon="package" tone="orange" /><StatCard label="Total customers" value="2,840" change="+8.1%" icon="users" tone="green" /></div><div className="dashboard-grid"><SalesChart /><LowStock /></div><div className="dashboard-grid lower-grid"><RecentOrders /><QuickActions /></div></div>
}
