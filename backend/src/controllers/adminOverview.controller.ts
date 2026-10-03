import type { Request, Response } from 'express'
import { AdminOverviewError, adminOverviewService, type AdminOverviewService } from '../services/adminOverview.service.js'

export function createAdminOverviewController(service: AdminOverviewService = adminOverviewService) {
  return {
    get: async (_request: Request, response: Response) => {
      try {
        response.json(await service.get())
      } catch (error) {
        if (error instanceof AdminOverviewError) console.error(error)
        else if (error instanceof Error) console.error(error)
        response.status(500).json({ error: 'Unable to load the store overview' })
      }
    },
  }
}
