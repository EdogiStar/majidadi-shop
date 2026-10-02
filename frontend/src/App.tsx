import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from './components/admin/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ProductsPage } from './pages/admin/ProductsPage'
import { OrdersPage } from './pages/admin/OrdersPage'
import { CustomersPage } from './pages/admin/CustomersPage'
import { PaymentsPage } from './pages/admin/PaymentsPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { StoreLayout } from './components/store/StoreLayout'
import { HomePage } from './pages/store/HomePage'
import { ShopPage } from './pages/store/ShopPage'
import { ProductDetailsPage } from './pages/store/ProductDetailsPage'
import { CartPage } from './pages/store/CartPage'
import { CheckoutPage } from './pages/store/CheckoutPage'
import { PaymentCallbackPage } from './pages/store/PaymentCallbackPage'
import { OrderTrackingPage } from './pages/store/OrderTrackingPage'
import './App.css'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const page = useMemo(() => {
    if (path === '/admin/products') return <ProductsPage />
    if (path === '/admin/orders') return <OrdersPage />
    if (path === '/admin/customers') return <CustomersPage />
    if (path === '/admin/payments') return <PaymentsPage />
    if (path === '/admin/settings') return <SettingsPage />
    return <DashboardPage />
  }, [path])
  if (path.startsWith('/admin')) {
    return <AdminLayout path={path} onNavigate={navigate}>{page}</AdminLayout>
  }
  const productMatch = path.match(/^\/products\/([^/]+)$/)
  const storePage = path === '/shop'
    ? <ShopPage />
    : path === '/cart'
      ? <CartPage />
      : path === '/checkout'
        ? <CheckoutPage />
        : path === '/payment/callback'
          ? <PaymentCallbackPage />
          : path === '/track-order'
            ? <OrderTrackingPage />
    : productMatch
      ? <ProductDetailsPage productId={productMatch[1]} />
      : <HomePage />
  return <StoreLayout>{storePage}</StoreLayout>
}

export default App
