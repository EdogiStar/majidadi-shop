import type { Request, Response } from 'express'
import { orderTrackingService, type OrderTrackingService } from '../services/orderTracking.service.js'

const ORDER_NUMBER_PATTERN = /^MJD-[A-Z0-9]+-[A-F0-9]{8}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createOrderTrackingController(service: OrderTrackingService = orderTrackingService) {
  return {
    track: async (request: Request, response: Response) => {
      const orderNumber = request.query.orderNumber
      const email = request.query.email
      if (typeof orderNumber !== 'string' || orderNumber.length > 40 || !ORDER_NUMBER_PATTERN.test(orderNumber.trim().toUpperCase())) {
        response.status(400).json({ error: 'Enter a valid order number' })
        return
      }
      if (typeof email !== 'string') {
        response.status(400).json({ error: 'Enter a valid email address' })
        return
      }
      const normalizedEmail = email.trim().toLowerCase()
      if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
        response.status(400).json({ error: 'Enter a valid email address' })
        return
      }

      try {
        const order = await service.find(orderNumber.trim().toUpperCase(), normalizedEmail)
        if (!order) {
          response.status(404).json({ error: 'Order not found. Check the order number and email address and try again.' })
          return
        }
        response.json({ order })
      } catch (error) {
        if (error instanceof Error) console.error(error)
        response.status(500).json({ error: 'Unable to track this order right now. Please try again.' })
      }
    },
  }
}
