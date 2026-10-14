import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { pontosRoutes } from './pontos.js'
import { residuosRoutes } from './residuos.js'
import { entregasRoutes } from './entregas.js'
import { melhorasRoutes } from './melhorias.js'
import { denunciasRoutes } from './denuncias.js'
import { usuariosRoutes } from './usuarios.js'
import { statsRoutes } from './stats.js'

export async function routes(app: FastifyInstance) {
  app.register(authRoutes,     { prefix: '/auth' })
  app.register(pontosRoutes,   { prefix: '/pontos' })
  app.register(residuosRoutes, { prefix: '/residuos' })
  app.register(entregasRoutes, { prefix: '/entregas' })
  app.register(melhorasRoutes, { prefix: '/melhorias' })
  app.register(denunciasRoutes,{ prefix: '/denuncias' })
  app.register(usuariosRoutes, { prefix: '/usuarios' })
  app.register(statsRoutes,     { prefix: '/stats' })
}
