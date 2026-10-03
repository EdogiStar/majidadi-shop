import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import healthRouter from './routes/health.routes.js'
import { createAdminProductRouter, createProductRouter } from './routes/product.routes.js'
import { createPaymentRouter } from './routes/payment.routes.js'
import { createOrderTrackingRouter } from './routes/orderTracking.routes.js'
import { createCustomerOrdersRouter } from './routes/customerOrders.routes.js'
import { createAdminOrdersRouter } from './routes/adminOrders.routes.js'
import { createAdminCustomersRouter } from './routes/adminCustomers.routes.js'
import { createAdminOverviewRouter } from './routes/adminOverview.routes.js'
import type { AccessTokenVerifier, AdminChecker } from './middleware/auth.middleware.js'
import { paymentService, type PaymentService } from './services/payment.service.js'
import { orderTrackingService, type OrderTrackingService } from './services/orderTracking.service.js'
import { productService, type ProductService } from './services/product.service.js'
import { customerOrdersService, type CustomerOrdersService } from './services/customerOrders.service.js'
import { adminOrdersService, type AdminOrdersService } from './services/adminOrders.service.js'
import { adminCustomersService, type AdminCustomersService } from './services/adminCustomers.service.js'
import { adminOverviewService, type AdminOverviewService } from './services/adminOverview.service.js'

morgan.token('safe-url', (request) => {
  const originalUrl = (request as typeof request & { originalUrl?: string }).originalUrl
  return (originalUrl ?? request.url ?? '').replace(/([?&]email=)[^&]*/i, '$1[redacted]')
})

export function createApp(
  products: ProductService = productService,
  adminAuth: { verifyAccessToken?: AccessTokenVerifier; isAdmin?: AdminChecker } = {},
  payments: PaymentService = paymentService,
  orderTracking: OrderTrackingService = orderTrackingService,
  customerOrders: CustomerOrdersService = customerOrdersService,
  adminOrders: AdminOrdersService = adminOrdersService,
  adminCustomers: AdminCustomersService = adminCustomersService,
  adminOverview: AdminOverviewService = adminOverviewService,
) {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') || false,
    }),
  )
  app.use(express.json())
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))

  app.use('/api/health', healthRouter)
  app.use('/api/products', createProductRouter(products))
  app.use('/api/payments', createPaymentRouter(payments, adminAuth.verifyAccessToken))
  app.use('/api/orders', createOrderTrackingRouter(orderTracking))
  app.use('/api/orders', createCustomerOrdersRouter(customerOrders, adminAuth.verifyAccessToken))
  app.use('/api/admin/orders', createAdminOrdersRouter(
    adminOrders,
    adminAuth.verifyAccessToken,
    adminAuth.isAdmin ?? products.isAdmin,
  ))
  app.use('/api/admin/customers', createAdminCustomersRouter(
    adminCustomers,
    adminAuth.verifyAccessToken,
    adminAuth.isAdmin ?? products.isAdmin,
  ))
  app.use('/api/admin/overview', createAdminOverviewRouter(
    adminOverview,
    adminAuth.verifyAccessToken,
    adminAuth.isAdmin ?? products.isAdmin,
  ))
  app.use('/api/admin/products', createAdminProductRouter(
    products,
    adminAuth.verifyAccessToken,
    adminAuth.isAdmin ?? products.isAdmin,
  ))

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found' })
  })

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    console.error(error)
    response.status(500).json({ error: 'Internal server error' })
  }

  app.use(errorHandler)

  return app
}

export default createApp()
