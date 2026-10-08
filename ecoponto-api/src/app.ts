import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
})

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

export default app
