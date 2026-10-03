import { Router } from 'express'
import { createProductController } from '../controllers/product.controller.js'
import { createRequireAdmin, createRequireAuth, type AccessTokenVerifier, type AdminChecker } from '../middleware/auth.middleware.js'
import { productService, type ProductService } from '../services/product.service.js'

export function createProductRouter(service: ProductService = productService) {
  const controller = createProductController(service)
  const router = Router()

  router.get('/', controller.list)
  router.get('/:id', controller.get)

  return router
}

export function createAdminProductRouter(
  service: ProductService = productService,
  verifyAccessToken?: AccessTokenVerifier,
  isAdmin: AdminChecker = service.isAdmin,
) {
  const controller = createProductController(service)
  const router = Router()
  const authenticate = verifyAccessToken
    ? createRequireAuth(verifyAccessToken)
    : createRequireAuth()
  const authorizeAdmin = createRequireAdmin(isAdmin)

  router.use(authenticate, authorizeAdmin)
  router.get('/categories', controller.listCategories)
  router.get('/', controller.listAdmin)
  router.get('/:id', controller.getAdmin)
  router.post('/', controller.create)
  router.patch('/:id', controller.update)
  router.delete('/:id', controller.delete)

  return router
}

export default createProductRouter()
