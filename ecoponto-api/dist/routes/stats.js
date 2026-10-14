import { StatsController } from '../modules/stats/presentation/stats.controller.js';
const statsController = new StatsController();
export async function statsRoutes(app) {
    app.get('/', async (req, reply) => statsController.summary(req, reply));
}
