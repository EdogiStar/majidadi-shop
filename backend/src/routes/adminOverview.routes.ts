import { Router } from 'express'
import { createAdminOverviewController } from '../controllers/adminOverview.controller.js'
import { createRequireAdmin, createRequireAuth, type AccessTokenVerifier, type AdminChecker } from '../middleware/auth.middleware.js'
import { productService } from '../services/product.service.js'
import { adminOverviewService, type AdminOverviewService } from '../services/adminOverview.service.js'

export function createAdminOverviewRouter(
  service: AdminOverviewService = adminOverviewService,
  verifyAccessToken?: AccessTokenVerifier,
  isAdmin: AdminChecker = productService.isAdmin,
) {
  const router = Router()
  router.use(createRequireAuth(verifyAccessToken), createRequireAdmin(isAdmin))
  router.get('/', createAdminOverviewController(service).get)
  return router
}
