import { Router } from 'express'
import { createAdminCustomersController } from '../controllers/adminCustomers.controller.js'
import { createRequireAdmin, createRequireAuth, type AccessTokenVerifier, type AdminChecker } from '../middleware/auth.middleware.js'
import { productService } from '../services/product.service.js'
import { adminCustomersService, type AdminCustomersService } from '../services/adminCustomers.service.js'

export function createAdminCustomersRouter(
  service: AdminCustomersService = adminCustomersService,
  verifyAccessToken?: AccessTokenVerifier,
  isAdmin: AdminChecker = productService.isAdmin,
) {
  const router = Router()
  router.use(createRequireAuth(verifyAccessToken), createRequireAdmin(isAdmin))
  const controller = createAdminCustomersController(service)
  router.get('/', controller.list)
  router.get('/:id', controller.find)
  return router
}
