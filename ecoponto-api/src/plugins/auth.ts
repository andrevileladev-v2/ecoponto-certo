import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string; tipo: string }
    user: { sub: string; role: string; tipo: string }
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Não autenticado' })
    }
  })

  app.decorate('authenticateAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
      if (req.user.role !== 'ADMIN') {
        reply.status(403).send({ error: 'Acesso negado' })
      }
    } catch {
      reply.status(401).send({ error: 'Não autenticado' })
    }
  })
})
