import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ecoponto';
}
const app = Fastify({ logger: true });
app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
});
app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
export default app;
