import assert from 'node:assert/strict'
import test from 'node:test'

import { StatsController } from './stats.controller.js'

test('summary applies the selected region and period to all metrics', async () => {
  const whereQueries: unknown[] = []
  const fakePrisma = {
    entrega: {
      groupBy: async (args: { where: unknown }) => {
        whereQueries.push(args.where)
        return []
      },
      aggregate: async (args: { where: unknown }) => {
        whereQueries.push(args.where)
        return { _sum: { quantidade: 125 } }
      },
      count: async (args: { where: unknown }) => {
        whereQueries.push(args.where)
        return 8
      },
    },
    ponto: {
      findUnique: async () => ({ id: 'point-1' }),
      findMany: async (args: { where?: unknown }) => {
        if (args.where) return [{ status: 'ATIVO', confiabilidade: 0.9 }]
        return [{ id: 'point-1', nome: 'Ponto Central', cidade: 'Vitória', estado: 'ES', pais: 'Brasil' }]
      },
    },
    usuario: {
      count: async (args: { where: unknown }) => {
        whereQueries.push(args.where)
        return 3
      },
      findMany: async () => [],
    },
    residuo: {
      findMany: async () => [],
    },
  } as any
  const controller = new StatsController(undefined, fakePrisma)
  let response: any
  const reply = { send: (payload: unknown) => { response = payload; return payload } } as any

  await controller.summary({
    query: { period: 'year', pais: 'Brasil', estado: 'ES', cidade: 'Vitória', pontoId: 'point-1' },
  } as any, reply)

  const deliveryFilters = whereQueries.filter((where) => Object.hasOwn(where as object, 'resultado'))
  assert.equal(deliveryFilters.length, 4)
  const leaderboardFilter = whereQueries.find((where) => Object.hasOwn(where as object, 'usuario')) as {
    usuario: { mostrar_no_dashboard: boolean }
  }
  assert.deepEqual(leaderboardFilter.usuario, { mostrar_no_dashboard: true })
  for (const where of deliveryFilters) {
    const query = where as any
    assert.equal(query.resultado, 'CONSEGUIU')
    assert.equal(query.criado_em.gte.toISOString(), '2026-01-01T00:00:00.000Z')
    assert.equal(query.criado_em.lte instanceof Date, true)
    assert.deepEqual(query.ponto, { pais: 'Brasil', estado: 'ES', cidade: 'Vitória', id: 'point-1' })
    if (Object.hasOwn(query, 'unidade')) {
      assert.equal(query.unidade, 'kg')
      assert.deepEqual(query.quantidade, { not: null })
    }
  }
  assert.deepEqual(whereQueries[4], {
    entregas: { some: deliveryFilters.find((where) => !Object.hasOwn(where as object, 'unidade')) },
  })
  assert.deepEqual(response.resumo, { total_kg: 125, entregas: 8, usuarios_ativos: 3 })
  assert.deepEqual(response.pontos, { total: 1, confiaveis: 1, verificar: 0, inativos: 0 })
  assert.equal(response.locais[0].id, 'point-1')
  assert.equal(response.locais[0].pais, 'Brasil')
  assert.equal(response.escopo.pais, 'Brasil')
})

test('summary rejects an unsupported period', async () => {
  let statusCode = 0
  let payload: unknown
  const controller = new StatsController(undefined, {} as any)
  const reply = {
    status: (code: number) => {
      statusCode = code
      return { send: (value: unknown) => { payload = value } }
    },
  } as any

  await controller.summary({ query: { period: 'decade' } } as any, reply)

  assert.equal(statusCode, 400)
  assert.deepEqual(payload, { error: 'Período inválido' })
})
