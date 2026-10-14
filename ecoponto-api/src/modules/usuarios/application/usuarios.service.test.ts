import assert from 'node:assert/strict'
import test from 'node:test'
import { UsuariosService } from './usuarios.service.js'

const service = new UsuariosService()

test('buildListWhere monta filtros por status e texto', () => {
  const where = service.buildListWhere({ q: 'maria', status: 'ATIVO' })
  assert.equal(where.status, 'ATIVO')
  assert.ok(Array.isArray(where.OR))
})

test('validateStatus rejeita status inválido', () => {
  const result = service.validateStatus('X')
  assert.equal(result.ok, false)
  assert.equal(result.error, 'status inválido')
})
