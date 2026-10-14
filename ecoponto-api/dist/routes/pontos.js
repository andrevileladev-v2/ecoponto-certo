import { PontosController } from '../modules/pontos/presentation/pontos.controller.js';
const pontosController = new PontosController();
export async function pontosRoutes(app) {
    app.get('/', async (req, reply) => pontosController.list(req, reply));
    app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.create(req, reply));
    app.get('/:id/entregas', async (req, reply) => pontosController.listEntregas(req, reply));
    app.get('/:id', async (req, reply) => pontosController.detail(req, reply));
    app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.update(req, reply));
    app.delete('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => pontosController.remove(req, reply));
    app.post('/:id/residuos', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.addResiduo(req, reply));
    app.delete('/:id/residuos/:residuoId', { preHandler: [app.authenticateAdmin] }, async (req, reply) => pontosController.removeResiduo(req, reply));
    app.post('/:id/residuos/:residuoId/votar', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.voteResiduo(req, reply));
    app.post('/:id/confirmar', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.confirmActivity(req, reply));
    app.post('/:id/salvar', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.save(req, reply));
    app.delete('/:id/salvar', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.unsave(req, reply));
    app.get('/:id/mensagens', async (req, reply) => pontosController.listMensagens(req, reply));
    app.post('/:id/mensagens', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.createMensagem(req, reply));
    app.delete('/:pontoId/mensagens/:msgId', { preHandler: [app.authenticate] }, async (req, reply) => pontosController.deleteMensagem(req, reply));
}
