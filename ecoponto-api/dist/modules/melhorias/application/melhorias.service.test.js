import assert from 'node:assert/strict';
import test from 'node:test';
import { MelhoriasService } from './melhorias.service.js';
const service = new MelhoriasService();
test('validateCreate rejeita campos vazios', () => {
    const result = service.validateCreate({ titulo: '', descricao: 'x', categoria: 'INfra' });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'titulo, descricao e categoria são obrigatórios');
});
test('validateCreate aceita payload completo', () => {
    const result = service.validateCreate({ titulo: 'Mapa', descricao: 'Excelente', categoria: 'INFRA' });
    assert.equal(result.ok, true);
});
