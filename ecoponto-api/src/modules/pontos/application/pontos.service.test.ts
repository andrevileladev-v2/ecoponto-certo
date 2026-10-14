import assert from 'node:assert/strict'
import test from 'node:test'
import { PontosService } from './pontos.service.js'

const service = new PontosService()

test('buildWhereClause aplica filtros do dashboard', () => {
  const where = service.buildWhereClause({
    cidade: 'Vitória',
    q: 'Centro',
    residuos: 'abc, def',
    status: 'ATIVO',
  })

  assert.deepEqual(where.cidade, { contains: 'Vitória', mode: 'insensitive' })
  assert.deepEqual(where.nome, { contains: 'Centro', mode: 'insensitive' })
  assert.equal(where.status, 'ATIVO')
  assert.deepEqual(where.residuos, {
    some: {
      residuo_id: { in: ['abc', 'def'] },
      status: 'CONFIRMADO',
    },
  })
})

test('applyDistanceFilter remove pontos fora do raio e ordena por proximidade', () => {
  const pontos = [
    { id: '1', lat: -20.648, lng: -40.515 },
    { id: '2', lat: -20.66, lng: -40.528 },
    { id: '3', lat: -21.8, lng: -41.3 },
  ]

  const result = service.applyDistanceFilter(pontos, -20.648, -40.515, 10)

  assert.equal(result.length, 2)
  assert.equal(result[0].id, '1')
})

test('resolveProposalVote exige 3 votos e aprovação mínima de 70%', () => {
  assert.equal(service.resolveProposalVote(2, 0), 'PENDENTE')
  assert.equal(service.resolveProposalVote(2, 1), 'REJEITADA')
  assert.equal(service.resolveProposalVote(3, 1), 'APROVADA')
  assert.equal(service.resolveProposalVote(1, 2), 'REJEITADA')
})

function diaFechado() {
  return { ativo: false, abertura: '', fechamento: '' }
}

function diaAberto(abertura: string, fechamento: string) {
  return { ativo: true, abertura, fechamento }
}

test('validateHorarios aceita um horário semanal válido', () => {
  const result = service.validateHorarios({
    seg: diaAberto('08:00', '17:00'),
    ter: diaAberto('08:00', '17:00'),
    qua: diaAberto('08:00', '17:00'),
    qui: diaAberto('08:00', '17:00'),
    sex: diaAberto('08:00', '17:00'),
    sab: diaFechado(),
    dom: diaFechado(),
  })
  assert.equal(result.ok, true)
})

test('validateHorarios rejeita abertura depois do fechamento', () => {
  const result = service.validateHorarios({
    seg: diaAberto('18:00', '08:00'),
    ter: diaFechado(),
    qua: diaFechado(),
    qui: diaFechado(),
    sex: diaFechado(),
    sab: diaFechado(),
    dom: diaFechado(),
  })
  assert.equal(result.ok, false)
})

test('formatHorarioResumo agrupa dias consecutivos com o mesmo horário', () => {
  const resumo = service.formatHorarioResumo({
    seg: diaAberto('08:00', '17:00'),
    ter: diaAberto('08:00', '17:00'),
    qua: diaAberto('08:00', '17:00'),
    qui: diaAberto('08:00', '17:00'),
    sex: diaAberto('08:00', '17:00'),
    sab: diaAberto('08:00', '12:00'),
    dom: diaFechado(),
  })
  assert.equal(resumo, 'Seg–Sex 08:00–17:00, Sáb 08:00–12:00')
})

test('formatHorarioResumo retorna null quando não há horários', () => {
  assert.equal(service.formatHorarioResumo(null), null)
})
