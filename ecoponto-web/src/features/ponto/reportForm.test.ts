import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addCustomReportResiduo,
  buildEntregaItemsPayload,
  canSubmitReport,
  toggleReportResiduo,
  validateReportItems,
  type ItemRelato,
  type ResiduoOpcao,
} from './reportForm'

const papel: ResiduoOpcao = { id: 'papel-id', nome: 'Papel', cor: '#fff' }
const vidro: ResiduoOpcao = { id: 'vidro-id', nome: 'Vidro', cor: '#00f' }

function item(overrides: Partial<ItemRelato> = {}): ItemRelato {
  return {
    key: papel.id,
    residuoId: papel.id,
    resultado: 'CONSEGUIU',
    quantidade: '',
    unidade: 'kg',
    motivo: '',
    motivoTexto: '',
    nomeCustom: '',
    ...overrides,
  }
}

test('seleciona vários materiais e remove apenas o material clicado', () => {
  const selected = toggleReportResiduo([], papel, 'CONSEGUIU')
  const withSecond = toggleReportResiduo(selected, vidro, 'CONSEGUIU')
  const removedFirst = toggleReportResiduo(withSecond, papel, 'CONSEGUIU')

  assert.deepEqual(withSecond.map((entry) => entry.residuoId), ['papel-id', 'vidro-id'])
  assert.deepEqual(removedFirst.map((entry) => entry.residuoId), ['vidro-id'])
})

test('materiais diferentes recebem resultado e dados independentes', () => {
  const items = [
    item({ resultado: 'CONSEGUIU', quantidade: '2' }),
    item({
      key: vidro.id,
      residuoId: vidro.id,
      resultado: 'NAO_CONSEGUIU',
      motivo: 'O recipiente estava cheio',
    }),
  ]

  assert.equal(validateReportItems(items), null)
  assert.deepEqual(buildEntregaItemsPayload(items), [
    { residuo_id: 'papel-id', resultado: 'CONSEGUIU', quantidade: 2, unidade: 'kg' },
    {
      residuo_id: 'vidro-id',
      resultado: 'NAO_CONSEGUIU',
      motivo: 'O recipiente estava cheio',
    },
  ])
})

test('material novo é aparado e selecionado como item pendente de nome', () => {
  const result = addCustomReportResiduo([], [papel], '  Óleo de cozinha  ', 'CONSEGUIU')

  assert.equal(result.error, undefined)
  assert.equal(result.items[0].residuoId, 'outro')
  assert.equal(result.items[0].nomeCustom, 'Óleo de cozinha')
  assert.deepEqual(buildEntregaItemsPayload(result.items), [
    { nome: 'Óleo de cozinha', resultado: 'CONSEGUIU' },
  ])
})

test('não adiciona material já cadastrado ignorando maiúsculas e espaços', () => {
  const result = addCustomReportResiduo([], [papel], ' papel ', 'CONSEGUIU')

  assert.equal(result.items.length, 0)
  assert.equal(result.error, 'Esse material já está na lista. Selecione-o acima.')
})

test('não permite adicionar duas vezes um material novo', () => {
  const first = addCustomReportResiduo([], [], 'Óleo', 'CONSEGUIU')
  const duplicate = addCustomReportResiduo(first.items, [], ' óleo ', 'CONSEGUIU')

  assert.equal(duplicate.items.length, 1)
  assert.equal(duplicate.error, 'Esse material já foi selecionado.')
})

test('exige ao menos um material', () => {
  assert.equal(validateReportItems([]), 'Selecione pelo menos um material para continuar.')
})

test('exige motivo apenas para material não descartado', () => {
  assert.equal(
    validateReportItems([item({ resultado: 'NAO_CONSEGUIU' })]),
    'Escolha o motivo de cada item que não conseguiu descartar.',
  )
  assert.equal(validateReportItems([item({ resultado: 'CONSEGUIU' })]), null)
})

test('exige descrição quando o motivo do item não descartado é Outro', () => {
  assert.equal(
    validateReportItems([item({ resultado: 'NAO_CONSEGUIU', motivo: 'Outro' })]),
    'Descreva o motivo selecionado como “Outro”.',
  )
  assert.equal(
    validateReportItems([item({ resultado: 'NAO_CONSEGUIU', motivo: 'Outro', motivoTexto: 'Local sem acesso' })]),
    null,
  )
})

test('quantidade é opcional, mas quando informada deve ser positiva e finita', () => {
  assert.equal(validateReportItems([item()]), null)
  assert.equal(validateReportItems([item({ quantidade: '0' })]), 'A quantidade deve ser maior que zero.')
  assert.equal(validateReportItems([item({ quantidade: '-2' })]), 'A quantidade deve ser maior que zero.')
  assert.equal(validateReportItems([item({ quantidade: 'infinito' })]), 'A quantidade deve ser maior que zero.')
})

test('payload não envia motivo de item conseguido e converte quantidade e unidade', () => {
  assert.deepEqual(buildEntregaItemsPayload([
    item({ quantidade: '1.5', unidade: 'saco', motivo: 'Outro', motivoTexto: 'ignorado' }),
  ]), [
    { residuo_id: 'papel-id', resultado: 'CONSEGUIU', quantidade: 1.5, unidade: 'saco' },
  ])
})

test('bloqueia envio sem usuário ou ponto, durante envio ou após salvar', () => {
  assert.equal(canSubmitReport(false, 'ponto-1', false, false), false)
  assert.equal(canSubmitReport(true, undefined, false, false), false)
  assert.equal(canSubmitReport(true, 'ponto-1', true, false), false)
  assert.equal(canSubmitReport(true, 'ponto-1', false, true), false)
  assert.equal(canSubmitReport(true, 'ponto-1', false, false), true)
})
