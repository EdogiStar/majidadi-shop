import { Router } from 'express'
import { createOrderTrackingController } from '../controllers/orderTracking.controller.js'
import { orderTrackingService, type OrderTrackingService } from '../services/orderTracking.service.js'

export function createOrderTrackingRouter(service: OrderTrackingService = orderTrackingService) {
  const router = Router()
  router.get('/track', createOrderTrackingController(service).track)
  return router
}

export default createOrderTrackingRouter()
