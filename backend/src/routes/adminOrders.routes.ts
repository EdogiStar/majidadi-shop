import { Router } from 'express'
import { createAdminOrdersController } from '../controllers/adminOrders.controller.js'
import { createRequireAdmin, createRequireAuth, type AccessTokenVerifier, type AdminChecker } from '../middleware/auth.middleware.js'
import { adminOrdersService, type AdminOrdersService } from '../services/adminOrders.service.js'
import { productService } from '../services/product.service.js'

export function createAdminOrdersRouter(
  service: AdminOrdersService = adminOrdersService,
  verifyAccessToken?: AccessTokenVerifier,
  isAdmin: AdminChecker = productService.isAdmin,
) {
  const router = Router()
  router.use(
    createRequireAuth(verifyAccessToken),
    createRequireAdmin(isAdmin),
  )
  const controller = createAdminOrdersController(service)
  router.get('/', controller.list)
  router.get('/:id', controller.find)
  router.patch('/:id/status', controller.updateStatus)
  return router
}
