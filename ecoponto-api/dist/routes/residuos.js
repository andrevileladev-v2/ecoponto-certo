import { ResiduosController } from '../modules/residuos/presentation/residuos.controller.js';
const residuosController = new ResiduosController();
export async function residuosRoutes(app) {
    app.get('/', async (req, reply) => residuosController.list(req, reply));
    app.get('/:id', async (req, reply) => residuosController.detail(req, reply));
    app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => residuosController.create(req, reply));
    app.put('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => residuosController.update(req, reply));
    app.patch('/:id/aprovar', { preHandler: [app.authenticateAdmin] }, async (req, reply) => residuosController.approve(req, reply));
    app.patch('/:id/rejeitar', { preHandler: [app.authenticateAdmin] }, async (req, reply) => residuosController.reject(req, reply));
    app.delete('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => residuosController.remove(req, reply));
}
