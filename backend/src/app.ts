import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import healthRouter from './routes/health.routes.js'
import { createAdminProductRouter, createProductRouter } from './routes/product.routes.js'
import type { AccessTokenVerifier, AdminChecker } from './middleware/auth.middleware.js'
import { productService, type ProductService } from './services/product.service.js'

export function createApp(
  products: ProductService = productService,
  adminAuth: { verifyAccessToken?: AccessTokenVerifier; isAdmin?: AdminChecker } = {},
) {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') || false,
    }),
  )
  app.use(express.json())
  app.use(morgan('combined'))

  app.use('/api/health', healthRouter)
  app.use('/api/products', createProductRouter(products))
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
