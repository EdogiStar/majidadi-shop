import { Router } from 'express'
import { createProductController } from '../controllers/product.controller.js'
import { productService, type ProductService } from '../services/product.service.js'

export function createProductRouter(service: ProductService = productService) {
  const controller = createProductController(service)
  const router = Router()

  router.get('/', controller.list)
  router.get('/:id', controller.get)

  return router
}

export default createProductRouter()
