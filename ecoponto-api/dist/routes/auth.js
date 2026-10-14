import { prisma } from '../lib/prisma.js';
import { AuthController } from '../modules/auth/presentation/auth.controller.js';
const authController = new AuthController();
export async function authRoutes(app) {
    app.post('/register', async (req, reply) => authController.register(req, reply));
    app.post('/login', async (req, reply) => authController.login(req, reply));
    app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const usuario = await prisma.usuario.findUnique({
            where: { id: sub },
            select: {
                id: true,
                email: true,
                nome: true,
                tipo: true,
                role: true,
                status: true,
                cidade: true,
                avatar_url: true,
                mostrar_no_dashboard: true,
                criado_em: true,
                empresa: true,
            },
        });
        if (!usuario)
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        return reply.send(usuario);
    });
}
