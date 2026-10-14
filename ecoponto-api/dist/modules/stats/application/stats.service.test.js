import assert from 'node:assert/strict';
import test from 'node:test';
import { StatsService } from './stats.service.js';
const service = new StatsService();
test('buildResiduoStats ordena por maior quantidade', () => {
    const result = service.buildResiduoStats([
        { residuo_id: 'b', _sum: { quantidade: 10 } },
        { residuo_id: 'a', _sum: { quantidade: 25 } },
    ]);
    assert.deepEqual(result[0], { residuo_id: 'a', total_kg: 25 });
});
