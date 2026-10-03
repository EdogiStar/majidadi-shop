import type { Request, Response } from 'express'
import {
  AdminCustomersError,
  adminCustomersService,
  type AdminCustomersService,
  type CustomerRole,
} from '../services/adminCustomers.service.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SEARCH_LENGTH = 120
const MAX_PAGE = 1_000_000
const MAX_PAGE_SIZE = 100

function parsePositiveInteger(value: unknown, fallback: number, maximum: number) {
  if (value === undefined) return fallback
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null
}

function normalizeSearch(value: string) {
  return value.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function createAdminCustomersController(service: AdminCustomersService = adminCustomersService) {
  return {
    list: async (request: Request, response: Response) => {
      for (const key of ['search', 'role', 'page', 'pageSize']) {
        if (request.query[key] !== undefined && typeof request.query[key] !== 'string') {
          response.status(400).json({ error: `${key} must be a string` })
          return
        }
      }
      const rawSearch = typeof request.query.search === 'string' ? request.query.search.trim() : ''
      const search = rawSearch ? normalizeSearch(rawSearch) : undefined
      const role = typeof request.query.role === 'string' && request.query.role ? request.query.role : undefined
      const page = parsePositiveInteger(request.query.page, 1, MAX_PAGE)
      const pageSize = parsePositiveInteger(request.query.pageSize, 20, MAX_PAGE_SIZE)

      if (rawSearch.length > MAX_SEARCH_LENGTH) {
        response.status(400).json({ error: `search must be ${MAX_SEARCH_LENGTH} characters or fewer` })
        return
      }
      if (role !== undefined && role !== 'customer' && role !== 'admin') {
        response.status(400).json({ error: 'role must be customer or admin' })
        return
      }
      if (page === null || pageSize === null) {
        response.status(400).json({ error: `page must be a positive integer and pageSize must be between 1 and ${MAX_PAGE_SIZE}` })
        return
      }

      try {
        response.json(await service.list({
          ...(search ? { search } : {}),
          ...(role ? { role: role as CustomerRole } : {}),
          page,
          pageSize,
        }))
      } catch (error) {
        handleError(error, response, 'Unable to retrieve customers')
      }
    },

    find: async (request: Request, response: Response) => {
      const id = request.params.id
      if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
        response.status(400).json({ error: 'Customer id must be a valid UUID' })
        return
      }
      try {
        const result = await service.find(id)
        if (!result) {
          response.status(404).json({ error: 'Customer not found' })
          return
        }
        response.json(result)
      } catch (error) {
        handleError(error, response, 'Unable to retrieve customer')
      }
    },
  }
}

function handleError(error: unknown, response: Response, fallback: string) {
  if (error instanceof AdminCustomersError) console.error(error)
  else if (error instanceof Error) console.error(error)
  response.status(500).json({ error: fallback })
}
