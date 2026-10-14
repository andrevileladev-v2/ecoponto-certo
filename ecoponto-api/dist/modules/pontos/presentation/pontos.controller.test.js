import assert from 'node:assert/strict';
import test from 'node:test';
import { PontosController } from './pontos.controller.js';
import { PontosService } from '../application/pontos.service.js';
test('controller list envia a lista filtrada do Prisma', async () => {
    const points = [
        {
            id: 'p1',
            nome: 'Ponto Central',
            endereco: 'Rua A',
            cidade: 'Vitória',
            estado: 'ES',
            lat: -20.648,
            lng: -40.515,
            status: 'ATIVO',
            confiabilidade: 0.9,
            residuos: [],
            _count: { confirmacoes: 3, mensagens: 1 },
        },
    ];
    const fakePrisma = {
        ponto: {
            findMany: async () => points,
        },
    };
    const controller = new PontosController(new PontosService(), fakePrisma);
    const req = {
        query: {
            q: 'Central',
            lat: '-20.648',
            lng: '-40.515',
            raio: '5000',
        },
    };
    const sent = [];
    const reply = {
        send(payload) {
            sent.push(payload);
            return payload;
        },
    };
    await controller.list(req, reply);
    assert.equal(sent.length, 1);
    assert.equal(sent[0][0].id, 'p1');
});
test('controller create valida dados mínimos do ponto', async () => {
    const fakePrisma = {
        ponto: {
            create: async () => ({ id: 'new-point', nome: 'Novo Ponto' }),
        },
    };
    const controller = new PontosController(new PontosService(), fakePrisma);
    const req = {
        user: { sub: 'user-1' },
        body: {
            nome: 'Novo Ponto',
            endereco: 'Rua B',
            cidade: 'Vitória',
            lat: -20.6,
            lng: -40.5,
        },
    };
    const sent = [];
    const reply = {
        status(code) {
            sent.push({ statusCode: code });
            return {
                send: (payload) => {
                    sent.push({ payload });
                    return payload;
                },
            };
        },
        send(payload) {
            sent.push({ payload });
            return payload;
        },
    };
    await controller.create(req, reply);
    assert.equal(sent.some((item) => item.statusCode === 201), true);
});
