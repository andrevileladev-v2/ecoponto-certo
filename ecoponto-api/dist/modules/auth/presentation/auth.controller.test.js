import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthController } from './auth.controller.js';
const fakePrisma = {
    usuario: {
        findUnique: async () => null,
        create: async () => ({
            id: 'u1',
            email: 'ana@email.com',
            nome: 'Ana',
            tipo: 'PF',
            role: 'USER',
            cidade: 'Vitória',
            criado_em: new Date(),
        }),
    },
};
test('controller register devolve 201 quando payload válido', async () => {
    const controller = new AuthController(undefined, fakePrisma);
    const req = {
        body: { email: 'ana@email.com', nome: 'Ana', senha: '123', tipo: 'PF', cidade: 'Vitória' },
        server: { jwt: { sign: (payload) => JSON.stringify(payload) } },
    };
    const sent = [];
    const reply = {
        status(code) {
            return { send(payload) { sent.push({ code, payload }); return payload; } };
        },
    };
    await controller.register(req, reply);
    assert.equal(sent[0].code, 201);
    assert.equal(sent[0].payload.usuario.email, 'ana@email.com');
});
test('controller register usa o jwt do server quando request.jwt não está disponível', async () => {
    const controller = new AuthController(new (await import('../application/auth.service.js')).AuthService(), fakePrisma);
    const req = {
        body: { email: 'bia@email.com', nome: 'Bia', senha: '123', tipo: 'PF', cidade: 'Vitória' },
        server: { jwt: { sign: () => 'signed-token' } },
    };
    const reply = {
        status(code) {
            return {
                send(payload) {
                    return { code, payload };
                },
            };
        },
    };
    const result = await controller.register(req, reply);
    assert.equal(result.payload.token, 'signed-token');
});
