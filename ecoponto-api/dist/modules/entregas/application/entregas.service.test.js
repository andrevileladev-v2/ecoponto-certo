import assert from 'node:assert/strict';
import test from 'node:test';
import { EntregasService } from './entregas.service.js';
const service = new EntregasService();
test('buildWhere retorna filtro vazio quando não há filtro', () => {
    assert.deepEqual(service.buildWhere(), {});
});
test('validateCreate aceita itens cadastrados e itens informados pelo usuário', () => {
    const result = service.validateCreate({
        ponto_id: 'p1',
        items: [
            { residuo_id: 'r1', resultado: 'CONSEGUIU', quantidade: 2, },
            { nome: 'Óleo de cozinha', resultado: 'NAO_CONSEGUIU', motivo: 'Lixeira cheia' },
        ],
    });
    assert.equal(result.ok, true);
});
test('validateCreate exige motivo para cada item não descartado', () => {
    const result = service.validateCreate({
        ponto_id: 'p1',
        items: [{ residuo_id: 'r1', resultado: 'NAO_CONSEGUIU' }],
    });
    assert.deepEqual(result, { ok: false, error: 'Informe o motivo do item não descartado' });
});
