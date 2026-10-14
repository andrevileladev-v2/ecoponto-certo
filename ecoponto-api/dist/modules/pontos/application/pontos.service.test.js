import assert from 'node:assert/strict';
import test from 'node:test';
import { PontosService } from './pontos.service.js';
const service = new PontosService();
test('buildWhereClause aplica filtros do dashboard', () => {
    const where = service.buildWhereClause({
        cidade: 'Vitória',
        q: 'Centro',
        residuos: 'abc, def',
        status: 'ATIVO',
    });
    assert.deepEqual(where.cidade, { contains: 'Vitória', mode: 'insensitive' });
    assert.deepEqual(where.nome, { contains: 'Centro', mode: 'insensitive' });
    assert.equal(where.status, 'ATIVO');
    assert.deepEqual(where.residuos, {
        some: {
            residuo_id: { in: ['abc', 'def'] },
            status: 'CONFIRMADO',
        },
    });
});
test('applyDistanceFilter remove pontos fora do raio e ordena por proximidade', () => {
    const pontos = [
        { id: '1', lat: -20.648, lng: -40.515 },
        { id: '2', lat: -20.66, lng: -40.528 },
        { id: '3', lat: -21.8, lng: -41.3 },
    ];
    const result = service.applyDistanceFilter(pontos, -20.648, -40.515, 10);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, '1');
});
