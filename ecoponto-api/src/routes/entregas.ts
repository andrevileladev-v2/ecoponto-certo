import { FastifyInstance } from 'fastify'
import { EntregasController } from '../modules/entregas/presentation/entregas.controller.js'

const entregasController = new EntregasController()

export async function entregasRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => entregasController.list(req, reply))
  app.get('/stats', { preHandler: [app.authenticate] }, async (req, reply) => {
    return entregasController.stats(req, reply)
  })
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => entregasController.create(req, reply))
  app.patch('/:id', { preHandler: [app.authenticate] }, async (req, reply) => entregasController.updateStatus(req, reply))
}
