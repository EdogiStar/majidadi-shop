import { Router } from 'express'
import { createCustomerOrdersController } from '../controllers/customerOrders.controller.js'
import { createRequireAuth, type AccessTokenVerifier } from '../middleware/auth.middleware.js'
import { customerOrdersService, type CustomerOrdersService } from '../services/customerOrders.service.js'

export function createCustomerOrdersRouter(
  service: CustomerOrdersService = customerOrdersService,
  verifyAccessToken?: AccessTokenVerifier,
) {
  const router = Router()
  router.use(createRequireAuth(verifyAccessToken))
  const controller = createCustomerOrdersController(service)
  router.get('/', controller.list)
  router.get('/:orderNumber', controller.find)
  return router
}

export default createCustomerOrdersRouter()
