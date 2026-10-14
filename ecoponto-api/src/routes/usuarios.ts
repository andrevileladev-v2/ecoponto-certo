import { FastifyInstance } from 'fastify'
import { UsuariosController } from '../modules/usuarios/presentation/usuarios.controller.js'

const usuariosController = new UsuariosController()

export async function usuariosRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => usuariosController.me(req, reply))
  app.put('/me', { preHandler: [app.authenticate] }, async (req, reply) => usuariosController.updateProfile(req, reply))
  app.get('/me/salvos', { preHandler: [app.authenticate] }, async (req, reply) => usuariosController.saved(req, reply))
  app.get('/', { preHandler: [app.authenticateAdmin] }, async (req, reply) => usuariosController.list(req, reply))
  app.get('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => usuariosController.detail(req, reply))
  app.patch('/:id/status', { preHandler: [app.authenticateAdmin] }, async (req, reply) => usuariosController.updateStatus(req, reply))
  app.patch('/:id/role', { preHandler: [app.authenticateAdmin] }, async (req, reply) => usuariosController.updateRole(req, reply))
}
