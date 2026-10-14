import { MelhoriasController } from '../modules/melhorias/presentation/melhorias.controller.js';
const melhoriasController = new MelhoriasController();
export async function melhorasRoutes(app) {
    app.get('/', async (req, reply) => melhoriasController.list(req, reply));
    app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => melhoriasController.create(req, reply));
    app.patch('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => melhoriasController.updateStatus(req, reply));
}
