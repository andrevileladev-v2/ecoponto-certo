import assert from 'node:assert/strict'
import test from 'node:test'
import { AuthController } from './auth.controller.js'

const fakePrisma = {
  usuario: {
    findUnique: async () => null,
    create: async () => ({
      id: 'u1',
      email: 'ana@email.com',
      nome: 'Ana',
      tipo: 'PF',
      role: 'USER',
      cidade: 'Vitória',
      estado: 'ES',
      criado_em: new Date(),
    }),
  },
  empresa: {
    findUnique: async () => null,
  },
} as any

test('controller register devolve 201 quando payload válido', async () => {
  const controller = new AuthController(undefined as any, fakePrisma)

  const req = {
    body: { email: 'ana@email.com', nome: 'Ana', senha: 'senha-segura', tipo: 'PF', cidade: 'Vitória', estado: 'ES' },
    server: { jwt: { sign: (payload: any) => JSON.stringify(payload) } },
  } as any

  const sent: any[] = []
  const reply = {
    status(code: number) {
      return { send(payload: any) { sent.push({ code, payload }); return payload } }
    },
  } as any

  await controller.register(req, reply)

  assert.equal(sent[0].code, 201)
  assert.equal(sent[0].payload.usuario.email, 'ana@email.com')
})

test('controller register usa o jwt do server quando request.jwt não está disponível', async () => {
  const controller = new AuthController(new (await import('../application/auth.service.js')).AuthService(), fakePrisma)

  const req = {
    body: { email: 'bia@email.com', nome: 'Bia', senha: 'senha-segura', tipo: 'PF', cidade: 'Vitória', estado: 'ES' },
    server: { jwt: { sign: () => 'signed-token' } },
  } as any

  const sent: Array<{ code: number; payload: any }> = []
  const reply = {
    status(code: number) {
      return {
        send(payload: any) {
          sent.push({ code, payload })
          return payload
        },
      }
    },
  } as any

  await controller.register(req, reply)
  assert.equal(sent[0].payload.token, 'signed-token')
})
