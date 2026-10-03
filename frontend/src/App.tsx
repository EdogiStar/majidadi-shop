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
import { AccountPage, LoginPage, RegisterPage } from './pages/store/CustomerPages'
import { CustomerOrdersPage } from './pages/store/CustomerOrdersPage'
import { useAuth } from './context/useAuth'
import { getAdminRouteAccess } from './services/adminRouteAccess'
import './App.css'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const { user, role, loading, profileError } = useAuth()
  const adminAccess = getAdminRouteAccess({
    loading,
    authenticated: Boolean(user),
    role,
    profileError,
  })
  const adminRedirect = path.startsWith('/admin')
    ? adminAccess === 'login' ? '/login' : adminAccess === 'shop' ? '/shop' : null
    : null
  const activePath = adminRedirect ?? path
  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    if (adminRedirect) window.history.replaceState({}, '', adminRedirect)
  }, [adminRedirect])
  const page = useMemo(() => {
    if (activePath === '/admin/products') return <ProductsPage />
    if (activePath === '/admin/orders') return <OrdersPage />
    if (activePath === '/admin/customers') return <CustomersPage />
    if (activePath === '/admin/payments') return <PaymentsPage />
    if (activePath === '/admin/settings') return <SettingsPage />
    return <DashboardPage />
  }, [activePath])
  if (activePath.startsWith('/admin')) {
    if (adminAccess === 'allow') {
      return <AdminLayout path={activePath} onNavigate={navigate}>{page}</AdminLayout>
    }
    return <StoreLayout><main className="customer-page"><p className="customer-state" role={adminAccess === 'error' ? 'alert' : 'status'}>{adminAccess === 'error' ? profileError : 'Checking administrator access…'}</p></main></StoreLayout>
  }
  const productMatch = activePath.match(/^\/products\/([^/]+)$/)
  const customerOrderMatch = activePath.match(/^\/orders\/([^/]+)$/)
  const storePage = activePath === '/shop'
    ? <ShopPage />
    : activePath === '/cart'
      ? <CartPage />
      : activePath === '/checkout'
        ? <CheckoutPage />
        : activePath === '/payment/callback'
          ? <PaymentCallbackPage />
          : activePath === '/track-order'
            ? <OrderTrackingPage />
            : activePath === '/login'
              ? <LoginPage />
              : activePath === '/register'
                ? <RegisterPage />
                : activePath === '/account'
                  ? <AccountPage />
                  : activePath === '/orders'
                    ? <CustomerOrdersPage />
                    : customerOrderMatch
                      ? <CustomerOrdersPage orderNumber={decodeURIComponent(customerOrderMatch[1])} />
    : productMatch
      ? <ProductDetailsPage productId={productMatch[1]} />
      : <HomePage />
  return <StoreLayout>{storePage}</StoreLayout>
}

export default App
