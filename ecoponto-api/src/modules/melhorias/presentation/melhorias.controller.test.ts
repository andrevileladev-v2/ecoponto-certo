import assert from 'node:assert/strict'
import test from 'node:test'

import { MelhoriasController } from './melhorias.controller.js'

test('vote alterna o voto do usuário e retorna a contagem atualizada', async () => {
  const votes = new Set<string>()
  const fakePrisma = {
    melhoria: {
      findUnique: async () => ({ id: 'idea-1' }),
    },
    votoMelhoria: {
      findUnique: async () => votes.has('user-1:idea-1') ? { usuario_id: 'user-1' } : null,
      create: async () => {
        votes.add('user-1:idea-1')
      },
      delete: async () => {
        votes.delete('user-1:idea-1')
      },
      count: async () => votes.size,
    },
  } as any
  const controller = new MelhoriasController(undefined, fakePrisma)
  const req = { params: { id: 'idea-1' }, user: { sub: 'user-1' } } as any
  const responses: unknown[] = []
  const reply = { send: (payload: unknown) => responses.push(payload) } as any

  await controller.vote(req, reply)
  await controller.vote(req, reply)

  assert.deepEqual(responses, [
    { votado_por_mim: true, votos: 1 },
    { votado_por_mim: false, votos: 0 },
  ])
})

test('myVotes limita os votos ao usuário autenticado', async () => {
  let query: unknown
  const fakePrisma = {
    votoMelhoria: {
      findMany: async (args: unknown) => {
        query = args
        return [{ melhoria_id: 'idea-1' }, { melhoria_id: 'idea-2' }]
      },
    },
  } as any
  const controller = new MelhoriasController(undefined, fakePrisma)
  let response: unknown
  const reply = { send: (payload: unknown) => { response = payload } } as any

  await controller.myVotes({ user: { sub: 'user-1' } } as any, reply)

  assert.deepEqual(query, { where: { usuario_id: 'user-1' }, select: { melhoria_id: true } })
  assert.deepEqual(response, ['idea-1', 'idea-2'])
})
