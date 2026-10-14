import { DenunciasController } from '../modules/denuncias/presentation/denuncias.controller.js';
const denunciasController = new DenunciasController();
export async function denunciasRoutes(app) {
    app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => denunciasController.create(req, reply));
    app.get('/', { preHandler: [app.authenticateAdmin] }, async (req, reply) => denunciasController.list(req, reply));
    app.patch('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => denunciasController.resolve(req, reply));
}
