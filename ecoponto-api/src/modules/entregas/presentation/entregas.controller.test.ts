import assert from 'node:assert/strict'
import test from 'node:test'

import { EntregasController } from './entregas.controller.js'

test('stats conta os registros de confirmação do usuário autenticado', async () => {
  let query: unknown
  const fakePrisma = {
    confirmacaoAtividade: {
      count: async (args: unknown) => {
        query = args
        return 4
      },
    },
  } as any
  const controller = new EntregasController(undefined, fakePrisma)
  const req = { user: { sub: 'user-1' } } as any
  let response: unknown
  const reply = {
    send(payload: unknown) {
      response = payload
      return payload
    },
  } as any

  await controller.stats(req, reply)

  assert.deepEqual(query, { where: { usuario_id: 'user-1' } })
  assert.deepEqual(response, { confirmacoes: 4 })
})
