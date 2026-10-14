import fp from 'fastify-plugin';
export default fp(async function authPlugin(app) {
    app.decorate('authenticate', async (req, reply) => {
        try {
            await req.jwtVerify();
        }
        catch {
            reply.status(401).send({ error: 'Não autenticado' });
        }
    });
    app.decorate('authenticateAdmin', async (req, reply) => {
        try {
            await req.jwtVerify();
            if (req.user.role !== 'ADMIN') {
                reply.status(403).send({ error: 'Acesso negado' });
            }
        }
        catch {
            reply.status(401).send({ error: 'Não autenticado' });
        }
    });
});
