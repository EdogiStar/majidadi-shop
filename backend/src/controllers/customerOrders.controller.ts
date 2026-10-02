import type { Request, Response } from 'express'
import { CustomerOrdersError, customerOrdersService, type CustomerOrdersService } from '../services/customerOrders.service.js'

const ORDER_NUMBER_PATTERN = /^MJD-[A-Z0-9]+-[A-F0-9]{8}$/

export function createCustomerOrdersController(service: CustomerOrdersService = customerOrdersService) {
  return {
    list: async (request: Request, response: Response) => {
      try {
        response.json({ orders: await service.list(request.user!.id) })
      } catch (error) {
        handleError(error, response)
      }
    },
    find: async (request: Request, response: Response) => {
      const parameter = request.params.orderNumber
      const orderNumber = typeof parameter === 'string' ? parameter.trim().toUpperCase() : ''
      if (!orderNumber || orderNumber.length > 40 || !ORDER_NUMBER_PATTERN.test(orderNumber)) {
        response.status(400).json({ error: 'Enter a valid order number' })
        return
      }

      try {
        const order = await service.find(request.user!.id, orderNumber)
        if (!order) {
          response.status(404).json({ error: 'Order not found' })
          return
        }
        response.json({ order })
      } catch (error) {
        handleError(error, response)
      }
    },
  }
}

function handleError(error: unknown, response: Response) {
  if (error instanceof CustomerOrdersError) console.error(error)
  else if (error instanceof Error) console.error(error)
  response.status(500).json({ error: 'Unable to load your orders right now. Please try again.' })
}
