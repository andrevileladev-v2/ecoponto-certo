import assert from 'node:assert/strict'
import test from 'node:test'
import { StatsService } from './stats.service.js'

const service = new StatsService()

test('buildResiduoStats ordena por maior quantidade', () => {
  const result = service.buildResiduoStats([
    { residuo_id: 'b', _sum: { quantidade: 10 } },
    { residuo_id: 'a', _sum: { quantidade: 25 } },
  ])

  assert.deepEqual(result[0], { residuo_id: 'a', total_kg: 25 })
})

test('buildDateFilter retorna o início do mês em UTC', () => {
  const result = service.buildDateFilter('month', new Date('2026-10-13T16:00:00.000Z'))
  assert.deepEqual(result, {
    gte: new Date('2026-10-01T00:00:00.000Z'),
    lte: new Date('2026-10-13T16:00:00.000Z'),
  })
})

test('buildDateFilter retorna o início do ano em UTC', () => {
  const result = service.buildDateFilter('year', new Date('2026-10-13T16:00:00.000Z'))
  assert.deepEqual(result, {
    gte: new Date('2026-01-01T00:00:00.000Z'),
    lte: new Date('2026-10-13T16:00:00.000Z'),
  })
})

test('buildDateFilter não limita período total', () => {
  assert.equal(service.buildDateFilter('all'), undefined)
})
