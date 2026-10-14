import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import test from 'node:test';
import { UsuariosController } from './usuarios.controller.js';
function createReply() {
    const result = [];
    return {
        result,
        reply: {
            status(code) {
                return {
                    send(payload) {
                        result.push({ statusCode: code, payload });
                        return payload;
                    },
                };
            },
            send(payload) {
                result.push({ payload });
                return payload;
            },
        },
    };
}
test('updateProfile salva os dados editáveis e retorna somente campos públicos', async () => {
    let updateArgs;
    const fakePrisma = {
        usuario: {
            findUnique: async () => ({ id: 'user-1', senha_hash: null }),
            update: async (args) => {
                updateArgs = args;
                return {
                    id: 'user-1',
                    email: 'ana@example.com',
                    nome: 'Ana',
                    tipo: 'PF',
                    role: 'USER',
                    cidade: 'Vitória',
                    avatar_url: 'https://example.com/avatar.png',
                };
            },
        },
    };
    const controller = new UsuariosController(undefined, fakePrisma);
    const { reply, result } = createReply();
    await controller.updateProfile({
        user: { sub: 'user-1' },
        body: {
            nome: ' Ana ',
            email: ' ana@example.com ',
            cidade: ' Vitória ',
            avatar_url: ' https://example.com/avatar.png ',
        },
    }, reply);
    assert.equal(updateArgs.data.nome, 'Ana');
    assert.equal(updateArgs.data.email, 'ana@example.com');
    assert.equal(updateArgs.data.cidade, 'Vitória');
    assert.equal(updateArgs.data.avatar_url, 'https://example.com/avatar.png');
    assert.equal('senha_hash' in result[0].payload, false);
});
test('updateProfile exige e valida a senha atual para alterá-la', async () => {
    const senhaHash = await bcrypt.hash('senha-antiga-segura', 4);
    let updateArgs;
    const fakePrisma = {
        usuario: {
            findUnique: async () => ({ id: 'user-1', senha_hash: senhaHash }),
            update: async (args) => {
                updateArgs = args;
                return { id: 'user-1', email: 'ana@example.com' };
            },
        },
    };
    const controller = new UsuariosController(undefined, fakePrisma);
    const { reply } = createReply();
    await controller.updateProfile({
        user: { sub: 'user-1' },
        body: { senha_atual: 'senha-antiga-segura', senha_nova: 'senha-nova-segura' },
    }, reply);
    assert.equal(await bcrypt.compare('senha-nova-segura', updateArgs.data.senha_hash), true);
});
test('updateProfile rejeita senha atual incorreta', async () => {
    const senhaHash = await bcrypt.hash('senha-correta', 4);
    let updated = false;
    const fakePrisma = {
        usuario: {
            findUnique: async () => ({ id: 'user-1', senha_hash: senhaHash }),
            update: async () => {
                updated = true;
                return {};
            },
        },
    };
    const controller = new UsuariosController(undefined, fakePrisma);
    const { reply, result } = createReply();
    await controller.updateProfile({
        user: { sub: 'user-1' },
        body: { senha_atual: 'senha-errada', senha_nova: 'senha-nova-segura' },
    }, reply);
    assert.equal(updated, false);
    assert.equal(result[0].statusCode, 400);
});
