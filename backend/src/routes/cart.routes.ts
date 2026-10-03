import { Router } from 'express'
import { createCartController } from '../controllers/cart.controller.js'
import { createRequireAuth, type AccessTokenVerifier } from '../middleware/auth.middleware.js'
import { cartService, type CartService } from '../services/cart.service.js'

export function createCartRouter(
  service: CartService = cartService,
  verifyAccessToken?: AccessTokenVerifier,
) {
  const router = Router()
  router.use(createRequireAuth(verifyAccessToken))
  const controller = createCartController(service)
  router.get('/', controller.get)
  router.post('/items', controller.add)
  router.patch('/items/:productId', controller.update)
  router.delete('/items/:productId', controller.remove)
  router.delete('/', controller.clear)
  return router
}

export default createCartRouter()
