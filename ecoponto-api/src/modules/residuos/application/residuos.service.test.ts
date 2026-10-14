import assert from 'node:assert/strict'
import test from 'node:test'
import { ResiduosService } from './residuos.service.js'

const service = new ResiduosService()

test('buildWhere usa status padrão aprovado', () => {
  assert.deepEqual(service.buildWhere(), { status: 'APROVADO' })
})

test('validateCreate rejeita nome ou cor vazios', () => {
  const result = service.validateCreate({ nome: '', cor: '#fff' })
  assert.equal(result.ok, false)
  assert.equal(result.error, 'nome e cor são obrigatórios')
})
