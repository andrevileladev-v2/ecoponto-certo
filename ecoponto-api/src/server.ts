import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import authPlugin from './plugins/auth.js'
import { routes } from './routes/index.js'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ecoponto'
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'ecoponto-secret-dev'
}

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty' },
  },
})

// ── Plugins ──────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)                          // server-to-server
    if (origin.endsWith('.app.github.dev') || origin.endsWith('.netlify.app')) return cb(null, true)
    const allowed = process.env.CORS_ORIGIN || process.env.FRONTEND_URL
    if (!allowed || allowed === '*') return cb(null, true)     // dev ou wildcard
    if (origin === allowed) return cb(null, true)              // produção
    cb(new Error('CORS: origem não permitida'), false)
  },
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'ecoponto-secret-dev',
  sign: { expiresIn: '7d' },
})

await app.register(authPlugin)

// ── Rotas ────────────────────────────────────────────────────────────────────
await app.register(routes, { prefix: '/api' })

// Health check
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

// ── Start ────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3001
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`API rodando em http://${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
