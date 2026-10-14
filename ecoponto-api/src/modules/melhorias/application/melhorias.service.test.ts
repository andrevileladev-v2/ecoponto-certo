import assert from 'node:assert/strict'
import test from 'node:test'
import { MelhoriasService } from './melhorias.service.js'

const service = new MelhoriasService()

test('validateCreate rejeita campos vazios', () => {
  const result = service.validateCreate({ titulo: '', descricao: 'x' })
  assert.equal(result.ok, false)
  assert.equal(result.error, 'titulo e descricao são obrigatórios')
})

test('validateCreate aceita payload completo', () => {
  const result = service.validateCreate({ titulo: 'Mapa', descricao: 'Excelente' })
  assert.equal(result.ok, true)
})

test('validateCreate limita tamanho de título e descrição', () => {
  const result = service.validateCreate({ titulo: 'x'.repeat(121), descricao: 'descrição' })
  assert.equal(result.ok, false)
})

test('validateUpdate aceita andamento público válido', () => {
  assert.equal(service.validateUpdate({
    status: 'NAO_PLANEJADO',
    viabilidade: 'NAO_VIAVEL',
    previsao: 'Sem previsão no momento',
    resposta: 'A equipe não consegue priorizar essa ideia neste ciclo.',
  }).ok, true)
})

test('validateUpdate rejeita status e viabilidade desconhecidos', () => {
  assert.equal(service.validateUpdate({ status: 'INVENTADO' }).ok, false)
  assert.equal(service.validateUpdate({ viabilidade: 'INVENTADA' }).ok, false)
})

test('validateUpdate rejeita payload vazio', () => {
  assert.equal(service.validateUpdate({}).ok, false)
})
