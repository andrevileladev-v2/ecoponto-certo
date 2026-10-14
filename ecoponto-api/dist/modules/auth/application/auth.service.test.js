import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from './auth.service.js';
const service = new AuthService();
test('validateRegister rejeita dados obrigatórios faltando', () => {
    const result = service.validateRegister({ email: '', nome: 'Ana' });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'email, nome e senha são obrigatórios');
});
test('createToken gera payload com sub, role e tipo', () => {
    const token = service.createToken({ sign: (payload) => JSON.stringify(payload) }, { id: 'user-1', role: 'USER', tipo: 'PF' });
    const payload = JSON.parse(token);
    assert.equal(payload.sub, 'user-1');
    assert.equal(payload.role, 'USER');
    assert.equal(payload.tipo, 'PF');
});
