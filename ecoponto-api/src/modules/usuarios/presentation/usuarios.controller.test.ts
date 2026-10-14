import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import test from 'node:test'

import { UsuariosController } from './usuarios.controller.js'

function createReply() {
  const result: Array<{ statusCode?: number; payload?: unknown }> = []
  return {
    result,
    reply: {
      status(code: number) {
        return {
          send(payload: unknown) {
            result.push({ statusCode: code, payload })
            return payload
          },
        }
      },
      send(payload: unknown) {
        result.push({ payload })
        return payload
      },
    } as any,
  }
}

test('updateProfile salva os dados editáveis e retorna somente campos públicos', async () => {
  let updateArgs: any
  const fakePrisma = {
    usuario: {
      findUnique: async () => ({ id: 'user-1', senha_hash: null }),
      update: async (args: any) => {
        updateArgs = args
        return {
          id: 'user-1',
          email: 'ana@example.com',
          nome: 'Ana',
          tipo: 'PF',
          role: 'USER',
          cidade: 'Vitória',
          avatar_url: 'https://example.com/avatar.png',
          mostrar_no_dashboard: false,
        }
      },
    },
  } as any
  const controller = new UsuariosController(undefined, fakePrisma)
  const { reply, result } = createReply()

  await controller.updateProfile({
    user: { sub: 'user-1' },
    body: {
      nome: ' Ana ',
      email: ' ana@example.com ',
      cidade: ' Vitória ',
      avatar_url: ' https://example.com/avatar.png ',
      mostrar_no_dashboard: false,
    },
  } as any, reply)

  assert.equal(updateArgs.data.nome, 'Ana')
  assert.equal(updateArgs.data.email, 'ana@example.com')
  assert.equal(updateArgs.data.cidade, 'Vitória')
  assert.equal(updateArgs.data.avatar_url, 'https://example.com/avatar.png')
  assert.equal(updateArgs.data.mostrar_no_dashboard, false)
  assert.equal((result[0].payload as { mostrar_no_dashboard: boolean }).mostrar_no_dashboard, false)
  assert.equal('senha_hash' in (result[0].payload as object), false)
})

test('updateProfile exige e valida a senha atual para alterá-la', async () => {
  const senhaHash = await bcrypt.hash('senha-antiga-segura', 4)
  let updateArgs: any
  const fakePrisma = {
    usuario: {
      findUnique: async () => ({ id: 'user-1', senha_hash: senhaHash }),
      update: async (args: any) => {
        updateArgs = args
        return { id: 'user-1', email: 'ana@example.com' }
      },
    },
  } as any
  const controller = new UsuariosController(undefined, fakePrisma)
  const { reply } = createReply()

  await controller.updateProfile({
    user: { sub: 'user-1' },
    body: { senha_atual: 'senha-antiga-segura', senha_nova: 'senha-nova-segura' },
  } as any, reply)

  assert.equal(await bcrypt.compare('senha-nova-segura', updateArgs.data.senha_hash), true)
})

test('updateProfile rejeita senha atual incorreta', async () => {
  const senhaHash = await bcrypt.hash('senha-correta', 4)
  let updated = false
  const fakePrisma = {
    usuario: {
      findUnique: async () => ({ id: 'user-1', senha_hash: senhaHash }),
      update: async () => {
        updated = true
        return {}
      },
    },
  } as any
  const controller = new UsuariosController(undefined, fakePrisma)
  const { reply, result } = createReply()

  await controller.updateProfile({
    user: { sub: 'user-1' },
    body: { senha_atual: 'senha-errada', senha_nova: 'senha-nova-segura' },
  } as any, reply)

  assert.equal(updated, false)
  assert.equal(result[0].statusCode, 400)
})
