import assert from 'node:assert/strict'
import test from 'node:test'
import { DenunciasService } from './denuncias.service.js'

const service = new DenunciasService()

test('validateCreate exige tipo e alvo', () => {
  const invalid = service.validateCreate({ tipo: 'SPAM' })
  assert.equal(invalid.ok, false)
  assert.equal(invalid.error, 'Informe ao menos um alvo (usuário, mensagem ou ponto)')
})

test('validateCreate aceita denuncia com alvo', () => {
  const result = service.validateCreate({ tipo: 'SPAM', alvo_ponto_id: 'p1' })
  assert.equal(result.ok, true)
})
