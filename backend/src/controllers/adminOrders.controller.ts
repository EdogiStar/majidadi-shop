import type { Request, Response } from 'express'
import {
  AdminOrdersError,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  adminOrdersService,
  type AdminOrdersService,
  type OrderStatus,
  type PaymentStatus,
} from '../services/adminOrders.service.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_PAGE_SIZE = 100
const MAX_PAGE = 1_000_000
const MAX_SEARCH_LENGTH = 120

function queryString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function parsePositiveInteger(value: string | undefined, fallback: number, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback
  if (!/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null
}

export function createAdminOrdersController(service: AdminOrdersService = adminOrdersService) {
  return {
    list: async (request: Request, response: Response) => {
      for (const key of ['search', 'status', 'paymentStatus', 'createdAfter', 'page', 'pageSize']) {
        if (request.query[key] !== undefined && typeof request.query[key] !== 'string') {
          response.status(400).json({ error: `${key} must be a string` })
          return
        }
      }

      const search = queryString(request.query.search)?.trim()
      const status = queryString(request.query.status)
      const paymentStatus = queryString(request.query.paymentStatus)
      const rawCreatedAfter = queryString(request.query.createdAfter)
      const createdAfterDate = rawCreatedAfter ? new Date(rawCreatedAfter) : null
      const page = parsePositiveInteger(queryString(request.query.page), 1, MAX_PAGE)
      const pageSize = parsePositiveInteger(queryString(request.query.pageSize), 20, MAX_PAGE_SIZE)

      if (search && search.length > MAX_SEARCH_LENGTH) {
        response.status(400).json({ error: `search must be ${MAX_SEARCH_LENGTH} characters or fewer` })
        return
      }
      if (status && !ORDER_STATUSES.includes(status as OrderStatus)) {
        response.status(400).json({ error: 'status is not supported' })
        return
      }
      if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus as PaymentStatus)) {
        response.status(400).json({ error: 'paymentStatus is not supported' })
        return
      }
      if (rawCreatedAfter && (!createdAfterDate || !Number.isFinite(createdAfterDate.getTime()))) {
        response.status(400).json({ error: 'createdAfter must be a valid date' })
        return
      }
      if (page === null || pageSize === null) {
        response.status(400).json({ error: `page must be a positive integer and pageSize must be between 1 and ${MAX_PAGE_SIZE}` })
        return
      }

      try {
        response.json(await service.list({
          ...(search ? { search } : {}),
          ...(status ? { status: status as OrderStatus } : {}),
          ...(paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
          ...(createdAfterDate ? { createdAfter: createdAfterDate.toISOString() } : {}),
          page,
          pageSize,
        }))
      } catch (error) {
        handleError(error, response, 'Unable to retrieve orders')
      }
    },

    find: async (request: Request, response: Response) => {
      const id = request.params.id
      if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
        response.status(400).json({ error: 'Order id must be a valid UUID' })
        return
      }

      try {
        const order = await service.find(id)
        if (!order) {
          response.status(404).json({ error: 'Order not found' })
          return
        }
        response.json({ order })
      } catch (error) {
        handleError(error, response, 'Unable to retrieve order')
      }
    },

    updateStatus: async (request: Request, response: Response) => {
      const id = request.params.id
      if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
        response.status(400).json({ error: 'Order id must be a valid UUID' })
        return
      }
      const body = request.body
      if (!body || typeof body !== 'object' || Array.isArray(body)
        || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'status')
        || typeof body.status !== 'string' || !ORDER_STATUSES.includes(body.status as OrderStatus)) {
        response.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` })
        return
      }

      try {
        const order = await service.updateStatus(id, body.status as OrderStatus)
        if (!order) {
          response.status(404).json({ error: 'Order not found' })
          return
        }
        response.json({ order })
      } catch (error) {
        handleError(error, response, 'Unable to update order status')
      }
    },
  }
}

function handleError(error: unknown, response: Response, fallback: string) {
  if (error instanceof AdminOrdersError) console.error(error)
  else if (error instanceof Error) console.error(error)
  response.status(500).json({ error: fallback })
}
