import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import healthRouter from './routes/health.routes.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || false,
  }),
)
app.use(express.json())
app.use(morgan('combined'))

app.use('/api/health', healthRouter)

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' })
})

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)

export default app
