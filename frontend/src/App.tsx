import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from './components/admin/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ProductsPage } from './pages/admin/ProductsPage'
import { OrdersPage } from './pages/admin/OrdersPage'
import { CustomersPage } from './pages/admin/CustomersPage'
import { PaymentsPage } from './pages/admin/PaymentsPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import './App.css'

function App() {
  const [path, setPath] = useState(() => window.location.pathname.startsWith('/admin') ? window.location.pathname : '/admin')
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
  return <AdminLayout path={path} onNavigate={navigate}>{page}</AdminLayout>
}

export default App
