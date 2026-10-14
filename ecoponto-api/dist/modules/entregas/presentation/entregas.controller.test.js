import assert from 'node:assert/strict';
import test from 'node:test';
import { EntregasController } from './entregas.controller.js';
test('stats conta os registros de confirmação do usuário autenticado', async () => {
    let query;
    const fakePrisma = {
        confirmacaoAtividade: {
            count: async (args) => {
                query = args;
                return 4;
            },
        },
    };
    const controller = new EntregasController(undefined, fakePrisma);
    const req = { user: { sub: 'user-1' } };
    let response;
    const reply = {
        send(payload) {
            response = payload;
            return payload;
        },
    };
    await controller.stats(req, reply);
    assert.deepEqual(query, { where: { usuario_id: 'user-1' } });
    assert.deepEqual(response, { confirmacoes: 4 });
});
