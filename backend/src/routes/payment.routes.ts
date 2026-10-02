import { Router } from 'express'
import { createPaymentController } from '../controllers/payment.controller.js'
import { createOptionalAuth, type AccessTokenVerifier } from '../middleware/auth.middleware.js'
import { paymentService, type PaymentService } from '../services/payment.service.js'

export function createPaymentRouter(
  service: PaymentService = paymentService,
  verifyAccessToken?: AccessTokenVerifier,
) {
  const controller = createPaymentController(service)
  const router = Router()

  router.post('/initialize', createOptionalAuth(verifyAccessToken), controller.initialize)
  router.post('/verify', controller.verify)

  return router
}

export default createPaymentRouter()
